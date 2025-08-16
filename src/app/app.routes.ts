import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayComponent } from './play/play.component';
import { MatchComponent } from './match/match.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'play', component: PlayComponent },
  { path: 'match/:id', component: MatchComponent },
  { path: '**', redirectTo: '' }
];
