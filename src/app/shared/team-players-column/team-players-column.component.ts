import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import type { Player } from '../types/player.model';
import { TruncatePipe } from '../pipes/truncate.pipe';

@Component({
  selector: 'app-team-players-column',
  standalone: true,
  imports: [TruncatePipe],
  templateUrl: './team-players-column.component.html',
  styleUrls: ['./team-players-column.component.css']
})
export class TeamPlayersColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) teamId!: 'A' | 'B';
  @Input({ required: true }) players: Player[] = [];
  @Input({ required: true }) points: Record<string, number> = {};
  @Input({ required: true }) topNames: Set<string> = new Set<string>();
  @Input({ required: true }) bottomNames: Set<string> = new Set<string>();
  @Input() disabled = false;

  @Output() adjust = new EventEmitter<{ team: 'A' | 'B'; player: Player; points: number }>();

  getPoints(p: Player): number {
    return this.points[p.playerName] ?? 0;
  }

  isTop(p: Player): boolean {
    return this.topNames.has(p.playerName);
  }

  isBottom(p: Player): boolean {
    return this.bottomNames.has(p.playerName);
  }

  onAdjust(player: Player, points: number) {
    if (this.disabled) return;
    this.adjust.emit({ team: this.teamId, player, points });
  }

  animateAndAdjust(target: EventTarget | null, player: Player, points: number) {
    if (this.disabled) return;

    const el = target as HTMLElement | null;
    if (el) {
      // set spin count via CSS var and add spin class
      const spins = Math.max(1, Math.min(3, Math.floor(points)));
      el.style.setProperty('--spin-count', String(spins));
      el.classList.remove('bb-spin');
      // Force reflow to restart animation if clicked repeatedly
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      void el.offsetWidth;
      el.classList.add('bb-spin');

      const durationMs = 600 * spins;
      window.setTimeout(() => {
        el.classList.remove('bb-spin');
      }, durationMs + 50);
    }

    this.adjust.emit({ team: this.teamId, player, points });
  }
}
