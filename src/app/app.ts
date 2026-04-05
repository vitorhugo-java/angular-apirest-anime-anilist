import { Component, signal, inject, OnInit, Signal, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { JikanAPI, Anime, Pagination } from './services/data/jikan-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  title: Signal<string> = signal('Seasonal Anime');
  private titleService: Title = inject(Title);
  private jikanAPI = inject(JikanAPI);
  animes = signal<Pagination<Anime[]> | null>(null);

  ngOnInit(): void {
    this.titleService.setTitle(this.title());
    this.jikanAPI.getSeasonalAnime().subscribe((data) => {
      this.animes.set(data);
    });
  }

  loadMore() {
    const currentAnimes = this.animes();
    if (!currentAnimes) return;

    const actualPage: number = currentAnimes.current_page;
    const nextPage = actualPage + 1;

    this.jikanAPI
      .getSeasonalAnime(undefined, nextPage)
      .subscribe((newAnimes: Pagination<Anime[]>) => {
        this.animes.update((prev) => {
          if (!prev) return newAnimes;
          return {
            ...prev,
            animes: [...prev.animes, ...newAnimes.animes],
            current_page: newAnimes.current_page,
            has_next_page: newAnimes.has_next_page,
          };
        });
      });
  }

  ellipsis(value: string, limit: number = 100): string {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + '...';
  }
}
