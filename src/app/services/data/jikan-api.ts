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

  getSeasonLabel(): string {
    const translated = {
      [Season.Winter]: 'Winter',
      [Season.Spring]: 'Spring',
      [Season.Summer]: 'Summer',
      [Season.Fall]: 'Fall',
    };
    return `${translated[this.currentSeason]} ${this.currentYear}`;
  }

  getAnimeRecommendations(animeId: number): Observable<Anime[]> {
    return this.http
      .get<{ data: Array<{ entry: AnimeApiModel[] }> }>(`${this.baseUrl}/anime/${animeId}/recommendations`)
      .pipe(
        map((response) =>
          response.data
            .flatMap((item) => item.entry)
            .filter((entry): entry is AnimeApiModel => !!entry?.mal_id)
            .map((entry) => this.mapAnime(entry)),
        ),
      );
  }

  getSeasonalAnime(
    season: Season = this.currentSeason,
    page: number = 1,
    sfw: boolean = true,
  ): Observable<Pagination<Anime[]>> {
    return this.http
      .get<{ pagination: PaginationMeta; data: AnimeApiModel[] }>(
        `${this.baseUrl}/seasons/${this.currentYear}/${season}`,
        { params: { page, sfw } },
      )
      .pipe(
        map((res) => ({
          ...res.pagination,
          animes: res.data.map((anime) => this.mapAnime(anime)),
        })),
      );
  }

  getAnimeById(id: number): Observable<Anime> {
    return this.http
      .get<{ data: AnimeApiModel }>(`${this.baseUrl}/anime/${id}/full`)
      .pipe(map((res) => this.mapAnime(res.data)));
  }

  searchAnime(query: string): Observable<Anime[]> {
    return this.http
      .get<{ data: AnimeApiModel[] }>(`${this.baseUrl}/anime`, { params: { q: query } })
      .pipe(map((res) => res.data.map((anime) => this.mapAnime(anime))));
  }

  private mapAnime(anime: AnimeApiModel): Anime {
    return {
      mal_id: anime.mal_id,
      url: anime.url,
      trailer: anime.trailer,
      title: anime.title,
      title_english: anime.title_english,
      title_japanese: anime.title_japanese,
      type: anime.type,
      episodes: anime.episodes,
      status: anime.status,
      score: anime.score,
      synopsis: anime.synopsis,
      year: anime.year,
      season: anime.season,
      rating: anime.rating,
      duration: anime.duration,
      images: {
        jpg: {
          image_url: anime.images?.jpg?.image_url ?? '',
          large_image_url: anime.images?.jpg?.large_image_url,
        },
        webp: {
          image_url: anime.images?.webp?.image_url,
          large_image_url: anime.images?.webp?.large_image_url,
        },
      },
      genres: anime.genres ?? [],
      studios: anime.studios ?? [],
      producers: anime.producers ?? [],
    };
  }
}

interface AnimeApiModel {
  mal_id: number;
  url: string;
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
  title: string;
  title_english?: string;
  title_japanese?: string;
  type?: string;
  episodes?: number;
  status?: string;
  score?: number;
  synopsis?: string;
  year?: number;
  season?: string;
  rating?: string;
  duration?: string;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  genres?: Genre[];
  studios?: Studio[];
  producers?: Studio[];
}

interface PaginationMeta {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface Genre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Studio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
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
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
  title: string;
  title_english?: string;
  title_japanese?: string;
  type?: string;
  episodes?: number;
  status?: string;
  score?: number;
  synopsis?: string;
  year?: number;
  season?: string;
  rating?: string;
  duration?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
    webp: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  genres: Genre[];
  studios: Studio[];
  producers: Studio[];
}
