import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JikanAPI {
  private readonly baseUrl = 'https://api.jikan.moe/v4';
  private http = inject(HttpClient);

  getRecommendations(): Observable<Anime[]> {
    return this.http.get<any>(`${this.baseUrl}/recommendations/anime`).pipe(
      map(response => response.data.flatMap((item: any) => [item.entry[0], item.entry[1]]))
    );
  }

  getAnimeById(id: number): Observable<Anime> {
    return this.http.get<Anime>(`${this.baseUrl}/anime/${id}`);
  }

  searchAnime(query: string): Observable<Anime[]> {
    return this.http.get<Anime[]>(`${this.baseUrl}/anime`, { params: { q: query } });
  }
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
