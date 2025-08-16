import { Component, Input, computed, signal } from '@angular/core';
import type { Player } from '../types/player.model';

export type Tier = 'bronze' | 'silver' | 'gold';

@Component({
  selector: 'app-card-qualificacao',
  standalone: true,
  imports: [],
  templateUrl: './card-qualificacao.component.html',
  styleUrl: './card-qualificacao.component.css'
})
export class CardQualificacaoComponent {
  @Input({ required: true }) player!: Player;
  @Input({ required: true }) teamPlayers: Player[] = [];
  /** Record keyed by Player.playerName with points in this match */
  @Input({ required: true }) pointsRecord!: Record<string, number>;
  /** Enable fancy animations (gold background shimmer). Default true. */
  @Input() animated = true;

  // internal signals for reactivity when inputs change
  private _player = signal<Player | null>(null);
  private _team = signal<Player[]>([]);
  private _points = signal<Record<string, number>>({});

  ngOnChanges(): void {
    // keep signals in sync to use computed safely
    this._player.set(this.player || null);
    this._team.set(this.teamPlayers || []);
    this._points.set(this.pointsRecord || {});
  }

  playerPoints = computed<number>(() => {
    const p = this._player();
    const rec = this._points();
    if (!p) return 0;
    return rec[p.playerName] ?? 0;

  });

  teamAvgExcludingSelf = computed<number>(() => {
    const p = this._player();
    const team = this._team();
    const rec = this._points();
    if (!p || team.length === 0) return 0;
    const others = team.filter(t => t.playerName !== p.playerName);
    if (others.length === 0) return 0; // no comparison
    const sum = others.reduce((acc, cur) => acc + (rec[cur.playerName] ?? 0), 0);
    return sum / others.length;
  });

  diffFromTeam = computed<number>(() => {
    return this.playerPoints() - this.teamAvgExcludingSelf();
  });

  /**
   * Classificação por diferença de pontos em relação à média do próprio time (excluindo o jogador):
   * - bronze: diferença pequena (< 3 pontos)
   * - silver: diferença mediana (>= 3 e < 6)
   * - gold: diferença grande (>= 6)
   * Ajuste fácil alterando os limites abaixo.
   */
  readonly smallDiff = 3; // < 3 -> bronze
  readonly mediumDiff = 6; // < 6 -> silver; >= 6 -> gold

  tier = computed<Tier>(() => {
    const diff = Math.abs(this.diffFromTeam());
    if (diff >= this.mediumDiff) return 'gold';
    if (diff >= this.smallDiff) return 'silver';
    return 'bronze';
  });

  tierLabel = computed<string>(() => {
    const t = this.tier();
    if (t === 'gold') return 'Ouro';
    if (t === 'silver') return 'Prata';
    return 'Bronze';
  });

  diffLabel = computed<string>(() => {
    const diff = this.diffFromTeam();
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
    const abs = Math.abs(Math.round(diff));
    return `${sign}${abs} vs time`;
  });
}
