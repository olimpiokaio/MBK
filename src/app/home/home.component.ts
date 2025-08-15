import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardPlayComponent } from "../shared/card-play/card-play.component";
import { Player } from '../shared/types/player.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardPlayComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  player = new Player(
    'Jayson Tatum',
    'https://lncimg.lance.com.br/uploads/2024/07/Jayson-Tatum-2-scaled-aspect-ratio-512-320-1.jpg',
    32,
    50,
    2503
  );
}
