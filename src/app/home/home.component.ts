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
    'Kaio Silva',
    'kaio-icon.jpeg',
    30,
    50,
    2503
  );
}
