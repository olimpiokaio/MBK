import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Player } from '../types/player.model';
import { CommonModule } from '@angular/common';
import { SelosService } from '../../services/selos.service';

export type PendingAdjustAction = { team: 'A' | 'B'; player: Player; points: number };

@Component({
  selector: 'app-adjust-points-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adjust-points-modal.component.html',
  styleUrls: ['./adjust-points-modal.component.css']
})
export class AdjustPointsModalComponent {
  @Input() open = false;
  @Input() pendingAction: PendingAdjustAction | null = null;
  @Input() isTopScorer = false;
  @Input() isBottomScorer = false;

  @Output() confirm = new EventEmitter<'sum' | 'sub'>();
  @Output() cancel = new EventEmitter<void>();

  private readonly APPLIED_KEY_BASE = 'mbk.store.applied.background';

  constructor(private selos: SelosService) {}

  get backgroundUrl(): string | null {
    // Only show background if the player being adjusted is the same as the current buyer
    const current = this.selos.currentPlayerName;
    const pendingPlayer = this.pendingAction?.player?.playerName;

    if (!current || !pendingPlayer || current !== pendingPlayer) {
      return null;
    }

    const key = `${this.APPLIED_KEY_BASE}.${current}`;
    try {
      const id = localStorage.getItem(key);
      return id ? `/backgrond-modal/${id}` : null;
    } catch {
      return null;
    }
  }

  onOverlayClick() {
    this.cancel.emit();
  }

  onCardClick(event: MouseEvent) {
    event.stopPropagation();
  }

  onConfirm(type: 'sum' | 'sub') {
    this.confirm.emit(type);
  }
}
