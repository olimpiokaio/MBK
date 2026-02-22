import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // aguarda 1 ciclo para o onAuthStateChanged hidratar o estado
  await Promise.resolve();
  if (auth.isLoggedIn()) {
    return true;
  }
  try { await router.navigateByUrl('/login'); } catch {}
  return false;
};
