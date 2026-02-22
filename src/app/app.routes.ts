import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayComponent } from './play/play.component';
import { MatchComponent } from './match/match.component';
import { CommunityComponent } from './community/community.component';
import { LegacyComponent } from './legacy/legacy.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LoginRegisterComponent } from './auth/login-register.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'play', component: PlayComponent, canActivate: [authGuard] },
  { path: 'community', component: CommunityComponent, canActivate: [authGuard] },
  { path: 'legacy', component: LegacyComponent, canActivate: [authGuard] },
  { path: 'match/:id', component: MatchComponent },
  { path: 'store', loadComponent: () => import('./mbk-store/mbk-store.component').then(m => m.MbkStoreComponent), canActivate: [authGuard] },
  { path: 'login', component: LoginRegisterComponent },
  { path: '**', component: NotFoundComponent }
];
