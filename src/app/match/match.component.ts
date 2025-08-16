import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from './match.service';
import { Player } from '../shared/types/player.model';
import { BackButtonComponent } from '../shared/back-button/back-button.component';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './match.component.html',
  styleUrl: './match.component.css'
})
export class MatchComponent {
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);

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
  private timerRef: any = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.communityId.set(id);
    const state = history.state as { name?: string };
    this.communityName.set(state?.name ?? '');

    this.players.set(this.matchService.getPlayersByCommunity(id));
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
    if (team === 'A') {
      let s = this.scoreA() + delta;
      if (s < 0) s = 0;
      this.scoreA.set(s);
      if (delta > 0 && s >= 14) this.finishGame('A');
    } else {
      let s = this.scoreB() + delta;
      if (s < 0) s = 0;
      this.scoreB.set(s);
      if (delta > 0 && s >= 14) this.finishGame('B');
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
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getPlayerMatchPoints(p: Player): number {
    return this.playerPoints().get(p.playerName) ?? 0;
  }
}
