import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

function clearBrowserStorageFactory() {
  return () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: APP_INITIALIZER, useFactory: clearBrowserStorageFactory, multi: true },
  ]
};
