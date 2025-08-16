import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import type { Player } from '../types/player.model';

@Component({
  selector: 'app-team-players-column',
  standalone: true,
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
}
