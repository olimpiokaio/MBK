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
  }
}
