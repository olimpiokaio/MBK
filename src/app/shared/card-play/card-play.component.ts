import { Component, input } from '@angular/core';
import type { Player } from '../types/player.model';

@Component({
  selector: 'app-card-play',
  standalone: true,
  imports: [],
  templateUrl: './card-play.component.html',
  styleUrl: './card-play.component.css',
})
export class CardPlayComponent {
  player = input.required<Player>();
}
