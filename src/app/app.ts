import { Component, signal, inject, OnInit, Signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { JikanAPI, Anime } from './services/data/jikan-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [AsyncPipe],
})
export class App implements OnInit {
  title: Signal<string> = signal('Catálogo de Animes Jikan API');
  private titleService: Title = inject(Title);
  private jikanAPI = inject(JikanAPI);
  animes$: Observable<Anime[]> = new Observable();

  ngOnInit(): void {
    this.titleService.setTitle(this.title());
    this.animes$ = this.jikanAPI.getRecommendations();

    this.animes$.subscribe((animes) => {
      console.log('Animes recomendados:', animes);
    });
  }
}
