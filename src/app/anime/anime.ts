import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { Anime as AnimeModel, JikanAPI } from '../services/data/jikan-api';

@Component({
  selector: 'app-anime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './anime.html',
})
export class Anime {
  // `inject()` substitui construtor para DI em classes standalone (Angular 15+).
  private readonly route = inject(ActivatedRoute);
  private readonly jikanApi = inject(JikanAPI);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  // `signal()` cria estado reativo local e síncrono do componente.
  anime = signal<AnimeModel | null>(null);
  recommendations = signal<AnimeModel[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  // `computed()` deriva estado automaticamente a partir de signals lidas no callback.
  leadRoles = computed(() => {
    const current = this.anime();
    if (!current) {
      return [] as Array<{ name: string; role: string; meta: string }>;
    }

    return [
      {
        name: current.title_english || current.title,
        role: current.type || 'Series',
        meta: current.studios[0]?.name || 'Studio TBA',
      },
      {
        name: current.studios[0]?.name || 'Unknown Studio',
        role: 'Studio',
        meta: current.producers[0]?.name || 'Production committee',
      },
      {
        name: current.rating || 'Not Rated',
        role: 'Classification',
        meta: current.status || 'Status pending',
      },
    ];
  });

  episodesPreview = computed(() => {
    const current = this.anime();
    if (!current) {
      return [] as Array<{ number: number; title: string; descriptor: string }>;
    }

    const total = Math.min(current.episodes ?? 3, 3);
    return Array.from({ length: total }, (_, index) => ({
      number: index + 1,
      title: this.getEpisodeTitle(index),
      descriptor: current.duration || '?? min',
    }));
  });

  related = computed(() => {
    const currentId = this.anime()?.mal_id;
    return this.recommendations()
      .filter((anime) => anime.mal_id !== currentId)
      .slice(0, 6);
  });

  ngOnInit() {
    // `paramMap` é um Observable da rota; muda quando o parâmetro `:id` muda.
    this.route.paramMap
      .pipe(
        // `switchMap` cancela a requisição anterior se o id mudar antes de concluir.
        switchMap((params) => {
          const id = Number(params.get('id'));

          if (!Number.isFinite(id) || id <= 0) {
            this.loading.set(false);
            this.errorMessage.set('Invalid anime id.');
            return of(null);
          }

          this.loading.set(true);
          this.errorMessage.set('');

          // `forkJoin` roda as chamadas em paralelo e emite quando ambas completam.
          return forkJoin({
            anime: this.jikanApi.getAnimeById(id),
            recommendations: this.jikanApi.getAnimeRecommendations(id),
          }).pipe(
            // `catchError` mantém o fluxo vivo e converte erro em estado de UI.
            catchError(() => {
              this.errorMessage.set('Unable to load anime details right now.');
              return of(null);
            }),
          );
        }),
        // Em `ngOnInit`, passe `DestroyRef` para garantir contexto válido e auto-unsubscribe.
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (!result) {
          return;
        }

        this.anime.set(result.anime);
        this.recommendations.set(result.recommendations);
        this.titleService.setTitle(`${result.anime.title} • Anime Detail`);
      });
  }

  poster(anime: AnimeModel): string {
    return anime.images.webp.large_image_url || anime.images.jpg.large_image_url || anime.images.jpg.image_url;
  }

  score(anime: AnimeModel): string {
    return anime.score ? anime.score.toFixed(1) : 'N/A';
  }

  synopsis(anime: AnimeModel): string {
    return anime.synopsis || 'No synopsis available for this title yet.';
  }

  private getEpisodeTitle(index: number): string {
    return `Episode ${index + 1}`;
  }
}
