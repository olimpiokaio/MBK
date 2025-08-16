import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlayersService } from '../services/players.service';
import { Player } from '../shared/types/player.model';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { NarratorService } from '../services/narrator.service';
import { TeamPlayersColumnComponent } from '../shared/team-players-column/team-players-column.component';
import { CardQualificacaoComponent } from '../shared/card-qualificacao/card-qualificacao.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [BackButtonComponent, TeamPlayersColumnComponent, CardQualificacaoComponent, LoadingSpinnerComponent],
  templateUrl: './match.component.html',
  styleUrl: './match.component.css'
})
export class MatchComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private playersService = inject(PlayersService);
  private narrator = inject(NarratorService);

  // Loading state
  loadingPlayers = signal<boolean>(true);

  communityId = signal<string>('');
  communityName = signal<string>('');
  players = signal<Player[]>([]);

  // Selection state
  selectedTeam = signal<'A' | 'B' | null>(null);
  teamA = signal<Player[]>([]);
  teamB = signal<Player[]>([]);

  // Derived state
  maxPerTeam = 3;
  allSelected = computed(() => this.teamA().length === this.maxPerTeam && this.teamB().length === this.maxPerTeam);

  // Game state
  gameStarted = signal<boolean>(false);
  running = signal<boolean>(false);
  timeLeft = signal<number>(600); // 10 minutes in seconds
  scoreA = signal<number>(0);
  scoreB = signal<number>(0);
  winner = signal<'A' | 'B' | 'Empate' | null>(null);
  // per-player points keyed by player name
  playerPoints = signal<Map<string, number>>(new Map());

  // UI effects state
  lastScoredTeam = signal<'A' | 'B' | null>(null);
  scoreboardPulse = signal<boolean>(false);
  confettiSide = signal<'A' | 'B' | null>(null);
  mobileTab = signal<'A' | 'B'>('A');

  // Statistics state
  statsOpen = signal<boolean>(false);

  private timerRef: any = null;

  // Narrator toggle state (UI)
  narratorOn = signal<boolean>(this.narrator.isEnabled());

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.communityId.set(id);
    const state = history.state as { name?: string };
    this.communityName.set(state?.name ?? '');

    // Simula chamada HTTP para obter jogadores por comunidade
    this.playersService.getPlayersByCommunity(id).subscribe({
      next: (list) => {
        this.players.set(list);
        this.loadingPlayers.set(false);
      },
      error: () => {
        // Even on error, stop loading to allow UI to show empty/error state
        this.loadingPlayers.set(false);
      }
    });
  }

  chooseTeam(team: 'A' | 'B') {
    this.selectedTeam.set(team);
  }

  isInAnyTeam(p: Player): boolean {
    return this.teamA().includes(p) || this.teamB().includes(p);
  }

  isSelectedForCurrent(p: Player): boolean {
    const current = this.selectedTeam();
    if (!current) return false;
    return (current === 'A' ? this.teamA() : this.teamB()).includes(p);
  }

  canSelect(p: Player): boolean {
    const current = this.selectedTeam();
    if (!current) return false;
    // Can't select if already in the other team
    const inOther = current === 'A' ? this.teamB().includes(p) : this.teamA().includes(p);
    if (inOther) return false;
    // Allow toggle off even if at max
    const currentTeam = current === 'A' ? this.teamA() : this.teamB();
    const already = currentTeam.includes(p);
    if (already) return true;
    return currentTeam.length < this.maxPerTeam;
  }

  togglePlayer(p: Player) {
    const current = this.selectedTeam();
    if (!current) return;
    if (!this.canSelect(p)) return;

    if (current === 'A') {
      const list = this.teamA().slice();
      const idx = list.indexOf(p);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else if (list.length < this.maxPerTeam) {
        list.push(p);
      }
      this.teamA.set(list);
      // Auto-advance to B when A completed and B not filled
      if (list.length === this.maxPerTeam && this.teamB().length < this.maxPerTeam) {
        this.selectedTeam.set('B');
      }
    } else {
      const list = this.teamB().slice();
      const idx = list.indexOf(p);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else if (list.length < this.maxPerTeam) {
        list.push(p);
      }
      this.teamB.set(list);
      // If B completed and A incomplete, switch back to A
      if (list.length === this.maxPerTeam && this.teamA().length < this.maxPerTeam) {
        this.selectedTeam.set('A');
      }
    }
  }

  resetSelection() {
    this.teamA.set([]);
    this.teamB.set([]);
    this.selectedTeam.set(null);
    // also reset game state
    this.stopTimer();
    this.gameStarted.set(false);
    this.running.set(false);
    this.timeLeft.set(600);
    this.scoreA.set(0);
    this.scoreB.set(0);
    this.winner.set(null);
    this.playerPoints.set(new Map());
  }

  // GAME LOGIC
  startGame() {
    // initialize player points map
    const map = new Map<string, number>();
    [...this.teamA(), ...this.teamB()].forEach(p => map.set(p.playerName, 0));
    this.playerPoints.set(map);

    // reset scores and timer
    this.scoreA.set(0);
    this.scoreB.set(0);
    this.timeLeft.set(600);
    this.winner.set(null);

    // reset effects
    this.lastScoredTeam.set(null);
    this.scoreboardPulse.set(false);
    this.confettiSide.set(null);

    this.gameStarted.set(true);
    this.running.set(true);
    this.startTimer();
  }

  private startTimer() {
    this.stopTimer();
    this.timerRef = setInterval(() => {
      const left = this.timeLeft() - 1;
      if (left <= 0) {
        this.timeLeft.set(0);
        this.finishGame();
      } else {
        this.timeLeft.set(left);
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  toggleTimer() {
    if (!this.gameStarted()) return;
    if (this.running()) {
      this.stopTimer();
      this.running.set(false);
    } else {
      if (this.winner()) return; // don't resume if finished
      this.running.set(true);
      this.startTimer();
    }
  }

  speakCurrentScore() {
    this.narrator.speakScore(this.scoreA(), this.scoreB());
  }

  toggleNarrator() {
    const on = this.narrator.toggleEnabled();
    this.narratorOn.set(on);
  }

  addPoints(team: 'A' | 'B', player: Player, points: number) {
    if (!this.gameStarted() || this.winner()) return;
    // update player points with clamping and compute actual delta applied
    const map = new Map(this.playerPoints());
    const current = map.get(player.playerName) ?? 0;
    let target = current + points;
    if (target < 0) target = 0;
    const delta = target - current;
    if (delta === 0) return;
    map.set(player.playerName, target);
    this.playerPoints.set(map);

    // update team score with the same delta and clamp to 0
    let newScoreA = this.scoreA();
    let newScoreB = this.scoreB();
    if (team === 'A') {
      let s = this.scoreA() + delta;
      if (s < 0) s = 0;
      this.scoreA.set(s);
      newScoreA = s;
      if (delta > 0 && s >= 14) this.finishGame('A');
    } else {
      let s = this.scoreB() + delta;
      if (s < 0) s = 0;
      this.scoreB.set(s);
      newScoreB = s;
      if (delta > 0 && s >= 14) this.finishGame('B');
    }

    // Announce only when points were added (not subtracted)
    if (delta > 0) {
      // trigger UI pulse and confetti
      this.lastScoredTeam.set(team);
      this.scoreboardPulse.set(true);
      this.confettiSide.set(team);
      setTimeout(() => { this.scoreboardPulse.set(false); }, 420);
      setTimeout(() => { this.confettiSide.set(null); }, 900);

      const totalsObj: Record<string, number> = Object.fromEntries(this.playerPoints());
      this.narrator.announceScore(
        player.playerName,
        delta,
        newScoreA,
        newScoreB,
        {
          scoringTeam: team,
          playerTotals: totalsObj
        }
      );
    }
  }

  // Modal logic for choosing to add or subtract points
  modalOpen = signal<boolean>(false);
  pendingAction = signal<{ team: 'A' | 'B'; player: Player; points: number } | null>(null);

  openAdjustPoints(team: 'A' | 'B', player: Player, points: number) {
    if (!this.gameStarted() || this.winner()) return;
    this.pendingAction.set({ team, player, points });
    this.modalOpen.set(true);
  }

  confirmAdjust(type: 'sum' | 'sub') {
    const action = this.pendingAction();
    if (!action) return;
    const pts = type === 'sum' ? action.points : -action.points;
    this.addPoints(action.team, action.player, pts);
    this.closeModal();
  }

  closeModal() {
    this.modalOpen.set(false);
    this.pendingAction.set(null);
  }

  private finishGame(winnerTeam?: 'A' | 'B') {
    this.stopTimer();
    this.running.set(false);
    if (winnerTeam) {
      this.winner.set(winnerTeam);
    } else {
      // decide by score
      if (this.scoreA() > this.scoreB()) this.winner.set('A');
      else if (this.scoreB() > this.scoreA()) this.winner.set('B');
      else this.winner.set('Empate');
    }
    // auto-close adjust modal if open
    this.closeModal();

    // Narrate end of game with winner and MVP
    const w = this.winner();
    const mvpName = this.mvpPlayer()?.playerName ?? null;
    if (w !== null) {
      this.narrator.announceEnd(w, mvpName);
    }
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getPlayerMatchPoints(p: Player): number {
    return this.playerPoints().get(p.playerName) ?? 0;
  }

  // Compute current max/min points among all players in the match.
  // If all players have the same points, we return null for both to avoid showing icons.
  topBottom = computed<{ max: number | null; min: number | null }>(() => {
    const map = this.playerPoints();
    const values = Array.from(map.values());
    if (values.length === 0) return { max: null, min: null };
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max === min) return { max: null, min: null };
    return { max, min };
  });

  isTopScorer(p: Player): boolean {
    const tb = this.topBottom();
    if (tb.max === null) return false;
    return this.getPlayerMatchPoints(p) === tb.max;
  }

  isBottomScorer(p: Player): boolean {
    const tb = this.topBottom();
    if (tb.min === null) return false;
    return this.getPlayerMatchPoints(p) === tb.min;
  }

  // Stats helpers
  private allPlayersInMatch(): Player[] {
    return [...this.teamA(), ...this.teamB()];
  }

  topScorerPlayer = computed<Player | null>(() => {
    const map = this.playerPoints();
    if (map.size === 0) return null;
    let best: Player | null = null;
    let bestPts = -1;
    for (const p of this.allPlayersInMatch()) {
      const pts = map.get(p.playerName) ?? 0;
      if (pts > bestPts) { best = p; bestPts = pts; }
      else if (pts === bestPts && best) {
        // tie-breaker: higher level, then higher totalPoints, then lexicographic name
        if (p.level > best.level) best = p;
        else if (p.level === best.level && p.totalPoints > best.totalPoints) best = p;
        else if (p.level === best.level && p.totalPoints === best.totalPoints && p.playerName.localeCompare(best.playerName) < 0) best = p;
      }
    }
    return best;
  });

  mvpPlayer = computed<Player | null>(() => {
    // For now, MVP == top scorer with same tie-breakers.
    return this.topScorerPlayer();
  });

  bestPlayer = computed<Player | null>(() => this.mvpPlayer());

  // Helper maps/sets for UI components
  playerPointsRecord = computed<Record<string, number>>(() => Object.fromEntries(this.playerPoints()));

  topNamesSet = computed<Set<string>>(() => {
    const tb = this.topBottom();
    if (tb.max === null) return new Set<string>();
    const set = new Set<string>();
    for (const [name, pts] of this.playerPoints()) {
      if (pts === tb.max) set.add(name);
    }
    return set;
  });

  bottomNamesSet = computed<Set<string>>(() => {
    const tb = this.topBottom();
    if (tb.min === null) return new Set<string>();
    const set = new Set<string>();
    for (const [name, pts] of this.playerPoints()) {
      if (pts === tb.min) set.add(name);
    }
    return set;
  });

  openStats() { if (this.winner() !== null) this.statsOpen.set(true); }
  closeStats() { this.statsOpen.set(false); }

    // Helper to get the team array of a given player by name
    teamFor(p: Player): Player[] {
      if (!p) return [];
      return this.teamA().some(x => x.playerName === p.playerName) ? this.teamA() : this.teamB();
    }

  computeTier(points: number): 'bronze' | 'silver' | 'gold' | 'diamond' {
    if (points >= 12) return 'diamond';
    if (points >= 9) return 'gold';
    if (points >= 6) return 'silver';
    return 'bronze';
  }

  ngOnDestroy(): void {
    // Ensure narrator stops speaking when leaving the match screen
    try { this.narrator.stop(); } catch {}
    // Also stop any running timers to avoid leaks
    try { this.stopTimer(); } catch {}
  }
}
