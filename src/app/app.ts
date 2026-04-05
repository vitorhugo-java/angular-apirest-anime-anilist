import { AsyncPipe } from '@angular/common';
import { Component, signal, inject, OnInit, Signal, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { JikanAPI, Anime } from './services/data/jikan-api';
import { BehaviorSubject, exhaustMap, finalize, Observable, scan } from 'rxjs';
import { IntersectDirective } from './directives/intersect.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, IntersectDirective],
})
export class App implements OnInit {
  title: Signal<string> = signal('Seasonal Anime');
  private titleService: Title = inject(Title);
  private jikanAPI = inject(JikanAPI);
  private page$ = new BehaviorSubject<number>(1);
  // Junta as paginas carregadas em uma unica lista para o infinite scroll.
  anime$: Observable<Anime[]> = this.page$.pipe(
    exhaustMap((page) => {
      // Ativa loading antes da chamada e desativa ao finalizar (sucesso ou erro).
      this.loading.set(true);
      return this.jikanAPI.getSeasonalAnime(undefined, page).pipe(finalize(() => this.loading.set(false)));
    }),
    scan((acc, curr) => [...acc, ...curr.animes], [] as Anime[]),
  );
  loading = signal(false);

  // Define o titulo da pagina e aciona a primeira busca ao iniciar o componente.
  ngOnInit(): void {
    this.titleService.setTitle(this.title());
    this.jikanAPI.getSeasonalAnime();
  }

  // Solicita a proxima pagina; o fluxo reativo faz o restante.
  loadMore() {
    this.page$.next(this.page$.value + 1);
  }

  // Reduz textos longos para manter o card compacto na interface.
  ellipsis(value: string, limit: number = 100): string {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + '...';
  }
}
