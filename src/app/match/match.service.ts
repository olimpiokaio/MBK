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
      new Player('João Silva', 'https://randomuser.me/api/portraits/men/31.jpg', 24, 0, 0),
      new Player('Pedro Santos', 'https://randomuser.me/api/portraits/men/22.jpg', 27, 0, 0),
      new Player('Rafael Lima', 'https://randomuser.me/api/portraits/men/45.jpg', 22, 0, 0),
      new Player('Carlos Souza', 'https://randomuser.me/api/portraits/men/18.jpg', 25, 0, 0),
      new Player('Tiago Ferreira', 'https://randomuser.me/api/portraits/men/55.jpg', 26, 0, 0),
      new Player('Marcelo Duarte', 'https://randomuser.me/api/portraits/men/21.jpg', 30, 0, 0),
      new Player('Vitor Mendes', 'https://randomuser.me/api/portraits/men/10.jpg', 24, 0, 0),
      new Player('Eduardo Barros', 'https://randomuser.me/api/portraits/men/47.jpg', 27, 0, 0),
      new Player('Leandro Farias', 'https://randomuser.me/api/portraits/men/7.jpg', 22, 0, 0),
      new Player('Henrique Moraes', 'https://randomuser.me/api/portraits/men/52.jpg', 28, 0, 0),
      new Player('Fábio Teixeira', 'https://randomuser.me/api/portraits/men/41.jpg', 25, 0, 0),
      new Player('Igor Ribeiro', 'https://randomuser.me/api/portraits/men/60.jpg', 23, 0, 0),
    ],
    '2': [
      new Player('Lucas Pereira', 'https://randomuser.me/api/portraits/men/12.jpg', 23, 0, 0),
      new Player('Bruno Almeida', 'https://randomuser.me/api/portraits/men/28.jpg', 29, 0, 0),
      new Player('Guilherme Costa', 'https://randomuser.me/api/portraits/men/33.jpg', 21, 0, 0),
      new Player('Rodrigo Pacheco', 'https://randomuser.me/api/portraits/men/19.jpg', 26, 0, 0),
      new Player('Samuel Batista', 'https://randomuser.me/api/portraits/men/23.jpg', 24, 0, 0),
      new Player('Daniel Moreira', 'https://randomuser.me/api/portraits/men/30.jpg', 22, 0, 0),
      new Player('Thiago Gomes', 'https://randomuser.me/api/portraits/men/38.jpg', 27, 0, 0),
      new Player('Wesley Pinto', 'https://randomuser.me/api/portraits/men/44.jpg', 25, 0, 0),
      new Player('Caio Fernandes', 'https://randomuser.me/api/portraits/men/48.jpg', 23, 0, 0),
      new Player('Márcio Queiroz', 'https://randomuser.me/api/portraits/men/53.jpg', 29, 0, 0),
    ],
    '3': [
      new Player('Matheus Rocha', 'https://randomuser.me/api/portraits/men/14.jpg', 26, 0, 0),
      new Player('Felipe Araújo', 'https://randomuser.me/api/portraits/men/36.jpg', 24, 0, 0),
      new Player('Diego Martins', 'https://randomuser.me/api/portraits/men/40.jpg', 28, 0, 0),
      new Player('André Nunes', 'https://randomuser.me/api/portraits/men/50.jpg', 22, 0, 0),
      new Player('Renato Cardoso', 'https://randomuser.me/api/portraits/men/15.jpg', 26, 0, 0),
      new Player('Alexandre Sales', 'https://randomuser.me/api/portraits/men/16.jpg', 24, 0, 0),
      new Player('Jonathan Souza', 'https://randomuser.me/api/portraits/men/20.jpg', 27, 0, 0),
      new Player('Patrick Duarte', 'https://randomuser.me/api/portraits/men/24.jpg', 23, 0, 0),
      new Player('Wallace Lima', 'https://randomuser.me/api/portraits/men/27.jpg', 28, 0, 0),
      new Player('Caue Araújo', 'https://randomuser.me/api/portraits/men/32.jpg', 22, 0, 0),
      new Player('Pablo Correia', 'https://randomuser.me/api/portraits/men/34.jpg', 25, 0, 0),
      new Player('Everton Silveira', 'https://randomuser.me/api/portraits/men/39.jpg', 29, 0, 0),
    ],
  };

  getPlayersByCommunity(communityId: string): Player[] {
    return this.playersByCommunity[communityId] ?? [];
  }
}
