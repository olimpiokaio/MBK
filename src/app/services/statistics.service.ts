import { Injectable } from '@angular/core';
import { Player } from '../shared/types/player.model';

/**
 * StatisticsService
 * Responsável por armazenar informações da partida em andamento
 * e aplicar as alterações nos jogadores ao final da partida.
 *
 * Armazena:
 *  - MVP da partida
 *  - Jogadores vencedores
 *  - Pontuação de cada jogador na partida
 */
@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private started = false;

  private playersInMatch: Player[] = [];
  private pointsByPlayer = new Map<string, number>();
  private winnersList: Player[] = [];
  private mvpPlayer: Player | null = null;

  // Inicializa/Reseta os dados para uma nova partida
  startMatch(players: Player[]): void {
    this.started = true;
    this.playersInMatch = [...players];
    this.pointsByPlayer.clear();
    for (const p of players) this.pointsByPlayer.set(p.playerName, 0);
    this.winnersList = [];
    this.mvpPlayer = null;
  }

  // Atualiza a pontuação total do jogador dentro da partida (valor absoluto da partida)
  recordPoints(player: Player, matchTotalPointsForPlayer: number): void {
    if (!this.started) return;
    if (!this.pointsByPlayer.has(player.playerName)) return;
    if (matchTotalPointsForPlayer < 0) matchTotalPointsForPlayer = 0;
    this.pointsByPlayer.set(player.playerName, matchTotalPointsForPlayer);
  }

  setWinners(players: Player[]): void {
    if (!this.started) return;
    this.winnersList = [...players];
  }

  setMVP(player: Player | null): void {
    if (!this.started) return;
    this.mvpPlayer = player;
  }

  get mvp(): Player | null { return this.mvpPlayer; }
  get winners(): Player[] { return this.winnersList; }
  get playerPoints(): ReadonlyMap<string, number> { return this.pointsByPlayer; }

  /**
   * Aplica as regras no final da partida:
   *  - Soma os pontos da partida em totalPoints de cada jogador envolvido
   *  - Vencedores ganham +1 level
   *  - MVP ganha +1 level
   *  - Perdedor perde -1 level (não abaixo de 0)
   *  - Em caso de empate, não há vencedores nem perdedores
   */
  finalizeAndApply(): void {
    if (!this.started) return;

    const winnersSet = new Set(this.winnersList.map(p => p.playerName));

    // 1) Somar totalPoints
    for (const p of this.playersInMatch) {
      const earned = this.pointsByPlayer.get(p.playerName) ?? 0;
      if (earned > 0) p.totalPoints += earned;
    }

    // 2) Ajustar level para vencedores
    for (const p of this.playersInMatch) {
      if (winnersSet.has(p.playerName)) {
        p.level += 1;
      }
    }

    // 3) Ajustar level para MVP (independente de ganhar/perder)
    if (this.mvpPlayer) {
      this.mvpPlayer.level += 1;
    }

    // 4) Ajustar level para perdedores (apenas se houver vencedores; em empate não penaliza)
    if (winnersSet.size > 0) {
      for (const p of this.playersInMatch) {
        if (!winnersSet.has(p.playerName)) {
          if (p.level > 0) p.level -= 1; // não deixar abaixo de 0
        }
      }
    }

    // marcar como finalizado
    this.started = false;
  }
}
