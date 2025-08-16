import { Component, Input } from '@angular/core';
import { Location, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.css',
})
export class BackButtonComponent {
  @Input() label: string = '← Back';
  /**
   * If provided and back is false, the button will navigate using routerLink
   * Default is "/" to mimic existing behavior.
   */
  @Input() route: string | any[] = '/';
  /**
   * When true, clicking the button will use browser history back instead of routerLink
   */
  @Input() back: boolean = false;
  /** Optional aria-label override */
  @Input() ariaLabel?: string;

  constructor(private location: Location) {}

  onBack() {
    this.location.back();
  }
}
