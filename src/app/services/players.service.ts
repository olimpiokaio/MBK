import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Player } from '../shared/types/player.model';

/**
 * PlayersService simula chamadas HTTP para buscar jogadores por comunidade.
 * Os dados estão mockados aqui e são retornados via Observable com delay.
 */
@Injectable({ providedIn: 'root' })
export class PlayersService {
  // Dados mockados: jogadores por id de comunidade
  private readonly playersByCommunity: Record<string, Player[]> = {
    '1': [
      new Player('Caio Dleon', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWUxFMZx2fz0TWcOm_Mxt9YomYcINM8arjKQ&s', 30, 0, 0),
      new Player('M.G', 'https://static.vecteezy.com/ti/vetor-gratis/p1/268540-silhueta-de-jogador-de-basquete-feminino-gratis-vetor.jpg', 27, 0, 0),
      new Player('Indiano', 'https://media.gazetadopovo.com.br/2017/11/3d1d26914284f2ccb778b346c39dbaa8-gpMedium.jpg', 19, 0, 0),
      new Player('Alisson vovô', 'https://static.vecteezy.com/ti/vetor-gratis/p1/16587998-personagem-de-desenho-animado-do-vovo-fofo-avo-jogando-ilustracao-de-chibi-de-basquete-vetor.jpg', 46, 0, 0),
      new Player('Nano', 'https://static.vecteezy.com/ti/vetor-gratis/p1/7410738-homem-barbudo-ilustracao-em-estilo-cartoon-plano-gratis-vetor.jpg', 32, 0, 0),
      new Player('Cassio', 'https://w7.pngwing.com/pngs/462/519/png-transparent-stephen-curry-the-nba-finals-drawing-golden-state-warriors-nba-child-face-hand.png', 30, 0, 0),
      new Player('Cavalo', 'https://i.pinimg.com/736x/2c/f7/a5/2cf7a5d343064d2941f2d39c85659d40.jpg', 19, 0, 0),
      new Player('Leandro', 'https://i.pinimg.com/originals/c3/30/74/c33074b9525f3dbff9c6344ee0710161.png', 23, 0, 0),
      new Player('Rodrigo', 'https://www.meganerd.it/wp-content/uploads/2022/05/Jotaro.0.jpeg', 22, 0, 0),
      new Player('Enzo', 'https://gartic.com.br/imgs/mural/yz/yz_fer/enzo-3.png', 18, 0, 0),
      new Player('Francisco', 'https://img.freepik.com/vetores-gratis/um-jogador-de-basquete-segura-uma-bola-com-as-duas-maos-e-corre-com-ela_1150-40625.jpg', 25, 0, 0),
      new Player('Pedro Henrique', 'https://us.123rf.com/450wm/sila5775/sila57751708/sila5775170800141/84231414-basketball-player-running-front-view-designed-on-sunlight-background-graphic-vector.jpg', 23, 0, 0),
      new Player('Kaio Silva', 'kaio-icon.jpeg', 18, 0, 0),
      new Player('Vagner', 'https://img.freepik.com/vetores-premium/silhueta-de-chama-escura-de-drible-de-basquete_9245-116.jpg?w=360', 18, 0, 0),
      new Player('jogador 1', 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg', 18, 0, 0),
      new Player('jogador 2', 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg', 18, 0, 0),
      new Player('jogador 3', 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg', 18, 0, 0),
      new Player('jogador 4', 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg', 18, 0, 0),
      new Player('jogador 5', 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg', 18, 0, 0),
      new Player('jogador 6', 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg', 18, 0, 0),
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

  /** Retorna jogadores da comunidade simulando uma chamada HTTP. */
  getPlayersByCommunity(communityId: string): Observable<Player[]> {
    const players = this.playersByCommunity[communityId] ?? [];
    return of(players).pipe(delay(600));
  }
}
