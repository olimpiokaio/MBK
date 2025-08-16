import { Injectable } from '@angular/core';
import { Player } from '../shared/types/player.model';

/**
 * Service that holds a JSON of players per community and exposes methods
 * to retrieve players for a given community id.
 */
@Injectable({ providedIn: 'root' })
export class MatchService {
  // Simulated JSON data: players grouped by community id
  private readonly playersByCommunity: Record<string, Player[]> = {
    '1': [
      new Player('João Silva', 'https://randomuser.me/api/portraits/men/31.jpg', 24, 62, 1200),
      new Player('Pedro Santos', 'https://randomuser.me/api/portraits/men/22.jpg', 27, 58, 980),
      new Player('Rafael Lima', 'https://randomuser.me/api/portraits/men/45.jpg', 22, 64, 1350),
      new Player('Carlos Souza', 'https://randomuser.me/api/portraits/men/18.jpg', 25, 60, 1105),
    ],
    '2': [
      new Player('Lucas Pereira', 'https://randomuser.me/api/portraits/men/12.jpg', 23, 55, 870),
      new Player('Bruno Almeida', 'https://randomuser.me/api/portraits/men/28.jpg', 29, 57, 990),
      new Player('Guilherme Costa', 'https://randomuser.me/api/portraits/men/33.jpg', 21, 61, 1230),
    ],
    '3': [
      new Player('Matheus Rocha', 'https://randomuser.me/api/portraits/men/14.jpg', 26, 66, 1410),
      new Player('Felipe Araújo', 'https://randomuser.me/api/portraits/men/36.jpg', 24, 63, 1285),
      new Player('Diego Martins', 'https://randomuser.me/api/portraits/men/40.jpg', 28, 59, 1010),
      new Player('André Nunes', 'https://randomuser.me/api/portraits/men/50.jpg', 22, 62, 1195),
    ],
  };

  getPlayersByCommunity(communityId: string): Player[] {
    return this.playersByCommunity[communityId] ?? [];
  }
}
