import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selo.component.html',
  styleUrl: './selo.component.css',
})
export class SeloComponent {
  /** Display name of the selo (badge) */
  @Input() name!: string;
  /** Image URL for the selo background */
  @Input() image!: string;
  /** If true, shows the selo in color; otherwise grayscale */
  @Input() earned: boolean = false;
  /** Optional aria-label override */
  @Input() ariaLabel?: string;
  /** Optional title override (tooltip) */
  @Input() title?: string;
}
