import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardPlayComponent } from "../shared/card-play/card-play.component";
import { Player } from '../shared/types/player.model';
import { PlayersService } from '../services/players.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardPlayComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // Initialize with placeholder; will be replaced by data from PlayersService
  player = new Player(
    'Kaio Silva',
    'kaio-icon.jpeg',
    30,
    0,
    0
  );

  constructor(private playersService: PlayersService) {}

  ngOnInit(): void {
    // Busca jogadores da comunidade 1 e encontra o usuário "Kaio Silva"
    this.playersService.getPlayersByCommunity('1').subscribe(players => {
      const kaio = players.find(p => p.playerName.toLowerCase() === 'kaio silva');
      if (kaio) {
        this.player = kaio;
      }
    });
  }
}
