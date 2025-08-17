import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayComponent } from './play/play.component';
import { MatchComponent } from './match/match.component';
import { CommunityComponent } from './community/community.component';
import { LegacyComponent } from './legacy/legacy.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'play', component: PlayComponent },
  { path: 'community', component: CommunityComponent },
  { path: 'legacy', component: LegacyComponent },
  { path: 'match/:id', component: MatchComponent },
  { path: '**', component: NotFoundComponent }
];
