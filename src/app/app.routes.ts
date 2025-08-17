import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayComponent } from './play/play.component';
import { MatchComponent } from './match/match.component';
import { CommunityComponent } from './community/community.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'play', component: PlayComponent },
  { path: 'community', component: CommunityComponent },
  { path: 'match/:id', component: MatchComponent },
  { path: '**', redirectTo: '' }
];
