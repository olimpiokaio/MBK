import { Component, Inject, HostBinding } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {
  private backgroundUrl: string;

  // Expose CSS custom property on the host to avoid inline styles in the template
  @HostBinding('style.--nf-bg-image') hostBgImage!: string;

  constructor(@Inject(DOCUMENT) private document: Document) {
    const baseHref = this.document.querySelector('base')?.getAttribute('href') ?? '/';
    this.backgroundUrl = baseHref.replace(/\/$/, '/') + '404/404baska.png';
    // Set CSS var to be used by component stylesheet
    this.hostBgImage = `url("${this.backgroundUrl}")`;
  }
}
