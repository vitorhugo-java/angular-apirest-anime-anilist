import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JikanAPI {
  private readonly baseUrl = 'https://api.jikan.moe/v4';
  private http = inject(HttpClient);
  private readonly currentYear = new Date().getFullYear();
  private readonly currentSeason = this.getCurrentSeason();

  private getCurrentSeason(): Season {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return Season.Winter;
    if (month >= 3 && month <= 5) return Season.Spring;
    if (month >= 6 && month <= 8) return Season.Summer;
    return Season.Fall;
  }

  getRecommendations(): Observable<Anime[]> {
    return this.http.get<any>(`${this.baseUrl}/recommendations/anime`).pipe(
      map(response => response.data.flatMap((item: any) => [item.entry[0], item.entry[1]]))
    );
  }

  getSeasonalAnime(season: Season = this.currentSeason, page: number = 1, sfw: boolean = true): Observable<Pagination<Anime[]>> {
    return this.http.get<any>(`${this.baseUrl}/seasons/${this.currentYear}/${season}`, { params: { page, sfw } }).pipe(
      map((res) => ({
        ...res.pagination,
        animes: res.data,
      })),
    );
  }

  getAnimeById(id: number): Observable<Anime> {
    return this.http.get<Anime>(`${this.baseUrl}/anime/${id}`);
  }

  searchAnime(query: string): Observable<Anime[]> {
    return this.http.get<Anime[]>(`${this.baseUrl}/anime`, { params: { q: query } });
  }
}

export interface Pagination<T> {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
  animes: T;
}

export enum Season {
  Winter = 'winter',
  Spring = 'spring',
  Summer = 'summer',
  Fall = 'fall',
}

export interface Anime {
  mal_id: number;
  url: string;
  trailer: {
    youtube_id: string;
    url: string;
    embed_url: string;
  };
  title: string;
  title_english: string;
  title_japanese: string;
  type: string;
  episodes: number;
  images: {
    jpg: {
      image_url: string;
    };
  };
}
