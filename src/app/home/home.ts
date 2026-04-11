import { AsyncPipe } from '@angular/common';
import {
  Component,
  signal,
  inject,
  OnInit,
  Signal,
  WritableSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { JikanAPI, Anime } from '../services/data/jikan-api';
import { BehaviorSubject, exhaustMap, finalize, Observable, scan, tap } from 'rxjs';
import { IntersectDirective } from '../directives/intersect.directive';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, IntersectDirective, RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  title: Signal<string> = signal('Seasonal Anime');
  currentSeasonLabel: WritableSignal<string> = signal('Current Season');
  private titleService: Title = inject(Title);
  private jikanAPI = inject(JikanAPI);
  private page$ = new BehaviorSubject<number>(1);
  hasNextPage = signal(true);
  // Junta as paginas carregadas em uma unica lista para o infinite scroll.
  anime$: Observable<Anime[]> = this.page$.pipe(
    exhaustMap((page) => {
      // Ativa loading antes da chamada e desativa ao finalizar (sucesso ou erro).
      this.loading.set(true);
      return this.jikanAPI.getSeasonalAnime(undefined, page).pipe(
        tap((pagination) => this.hasNextPage.set(pagination.has_next_page)),
        finalize(() => this.loading.set(false)),
      );
    }),
    // Evita repetir cards caso a API devolva itens duplicados entre paginas.
    scan((acc, curr) => {
      const keys = new Set(
        acc.map((anime) => `${anime.mal_id}-${anime.title.trim().toLowerCase()}`),
      );
      const next = curr.animes.filter((anime) => {
        const key = `${anime.mal_id}-${anime.title.trim().toLowerCase()}`;
        if (keys.has(key)) {
          return false;
        }
        keys.add(key);
        return true;
      });
      return [...acc, ...next];
    }, [] as Anime[]),
  );
  loading = signal(false);

  // Define o titulo da pagina e aciona a primeira busca ao iniciar o componente.
  ngOnInit(): void {
    this.titleService.setTitle(this.title());
    this.currentSeasonLabel.set(this.jikanAPI.getSeasonLabel());
  }

  // Solicita a proxima pagina; o fluxo reativo faz o restante.
  loadMore() {
    if (this.loading() || !this.hasNextPage()) {
      return;
    }

    this.page$.next(this.page$.value + 1);
  }

  // Reduz textos longos para manter o card compacto na interface.
  ellipsis(value: string, limit: number = 100): string {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + '...';
  }

  cardImage(anime: Anime): string {
    return anime.images.webp.large_image_url || anime.images.jpg.large_image_url || anime.images.jpg.image_url;
  }

  score(anime: Anime): string {
    return anime.score ? anime.score.toFixed(1) : 'N/A';
  }

  genre(anime: Anime, index: number): string {
    return anime.genres[index]?.name || (index === 0 ? 'Anime' : 'Series');
  }
}
