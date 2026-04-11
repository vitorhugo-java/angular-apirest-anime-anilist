import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'anime/:id', loadComponent: () => import('./anime/anime').then((m) => m.Anime) },
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
];
