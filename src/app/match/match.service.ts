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
      new Player('Tiago Ferreira', 'https://randomuser.me/api/portraits/men/55.jpg', 26, 65, 1320),
      new Player('Marcelo Duarte', 'https://randomuser.me/api/portraits/men/21.jpg', 30, 57, 940),
      new Player('Vitor Mendes', 'https://randomuser.me/api/portraits/men/10.jpg', 24, 63, 1255),
      new Player('Eduardo Barros', 'https://randomuser.me/api/portraits/men/47.jpg', 27, 60, 1110),
      new Player('Leandro Farias', 'https://randomuser.me/api/portraits/men/7.jpg', 22, 56, 905),
      new Player('Henrique Moraes', 'https://randomuser.me/api/portraits/men/52.jpg', 28, 67, 1490),
      new Player('Fábio Teixeira', 'https://randomuser.me/api/portraits/men/41.jpg', 25, 61, 1170),
      new Player('Igor Ribeiro', 'https://randomuser.me/api/portraits/men/60.jpg', 23, 59, 990),
    ],
    '2': [
      new Player('Lucas Pereira', 'https://randomuser.me/api/portraits/men/12.jpg', 23, 55, 870),
      new Player('Bruno Almeida', 'https://randomuser.me/api/portraits/men/28.jpg', 29, 57, 990),
      new Player('Guilherme Costa', 'https://randomuser.me/api/portraits/men/33.jpg', 21, 61, 1230),
      new Player('Rodrigo Pacheco', 'https://randomuser.me/api/portraits/men/19.jpg', 26, 62, 1180),
      new Player('Samuel Batista', 'https://randomuser.me/api/portraits/men/23.jpg', 24, 58, 960),
      new Player('Daniel Moreira', 'https://randomuser.me/api/portraits/men/30.jpg', 22, 60, 1080),
      new Player('Thiago Gomes', 'https://randomuser.me/api/portraits/men/38.jpg', 27, 64, 1300),
      new Player('Wesley Pinto', 'https://randomuser.me/api/portraits/men/44.jpg', 25, 56, 920),
      new Player('Caio Fernandes', 'https://randomuser.me/api/portraits/men/48.jpg', 23, 63, 1265),
      new Player('Márcio Queiroz', 'https://randomuser.me/api/portraits/men/53.jpg', 29, 65, 1405),
    ],
    '3': [
      new Player('Matheus Rocha', 'https://randomuser.me/api/portraits/men/14.jpg', 26, 66, 1410),
      new Player('Felipe Araújo', 'https://randomuser.me/api/portraits/men/36.jpg', 24, 63, 1285),
      new Player('Diego Martins', 'https://randomuser.me/api/portraits/men/40.jpg', 28, 59, 1010),
      new Player('André Nunes', 'https://randomuser.me/api/portraits/men/50.jpg', 22, 62, 1195),
      new Player('Renato Cardoso', 'https://randomuser.me/api/portraits/men/15.jpg', 26, 61, 1150),
      new Player('Alexandre Sales', 'https://randomuser.me/api/portraits/men/16.jpg', 24, 62, 1205),
      new Player('Jonathan Souza', 'https://randomuser.me/api/portraits/men/20.jpg', 27, 66, 1450),
      new Player('Patrick Duarte', 'https://randomuser.me/api/portraits/men/24.jpg', 23, 57, 980),
      new Player('Wallace Lima', 'https://randomuser.me/api/portraits/men/27.jpg', 28, 63, 1290),
      new Player('Caue Araújo', 'https://randomuser.me/api/portraits/men/32.jpg', 22, 59, 1015),
      new Player('Pablo Correia', 'https://randomuser.me/api/portraits/men/34.jpg', 25, 64, 1335),
      new Player('Everton Silveira', 'https://randomuser.me/api/portraits/men/39.jpg', 29, 68, 1520),
    ],
  };

  getPlayersByCommunity(communityId: string): Player[] {
    return this.playersByCommunity[communityId] ?? [];
  }
}
