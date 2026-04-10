import { Routes } from '@angular/router';
import { Anime } from './pages/anime/anime';

export const routes: Routes = [
  { path: '/pages/anime/:id', component: Anime },
];
