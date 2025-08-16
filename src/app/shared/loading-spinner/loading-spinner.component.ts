import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loader-wrap" role="status" aria-live="polite">
      <img class="spin-ball" src="/bola-icon.png" [alt]="text || 'Carregando'" />
      <p class="loader-text" *ngIf="text as t">{{ t }}</p>
    </div>
  `,
  styles: [
    `
    .loader-wrap { display: grid; place-items: center; gap: 0.6rem; padding: 2rem 0; }
    .spin-ball { width: 64px; height: 64px; animation: spin 1s linear infinite; filter: drop-shadow(0 0 10px rgba(255, 196, 0, 0.4)); }
    .loader-text { color: #cfd3ff; font-size: 0.95rem; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `
  ]
})
export class LoadingSpinnerComponent {
  @Input() text: string | null = null;
}
