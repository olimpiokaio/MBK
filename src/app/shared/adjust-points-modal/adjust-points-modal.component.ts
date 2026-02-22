import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import type { Player } from '../types/player.model';
import { CommonModule } from '@angular/common';
import { SelosService } from '../../services/selos.service';
import { UserDataService } from '../../services/user-data.service';

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

  private userData = inject(UserDataService);

  constructor(private selos: SelosService) {}

  get backgroundUrl(): string | null {
    // Only show background if the player being adjusted is the same as the current buyer
    const current = this.selos.currentPlayerName;
    const pendingPlayer = this.pendingAction?.player?.playerName;

    if (!current || !pendingPlayer || current !== pendingPlayer) {
      return null;
    }

    // Busca aplicada no Firebase (nota: é chamado durante render; para simplificar usamos getOnce síncrono via cache temporária)
    // Em UI real, ideal seria tornar async com estado de carregamento.
    let id: string | null = null;
    try { id = (window as any).__mbkAppliedBgIdCache ?? null; } catch {}
    // Se não houver cache, tentar carregar uma vez do Firebase e preencher cache para este ciclo
    if (!id) {
      this.userData.getAppliedBackgroundIdOnce().then(res => {
        try { (window as any).__mbkAppliedBgIdCache = res || null; } catch {}
      });
      return null; // primeiro ciclo sem imagem; será atualizado no próximo detecção de mudanças
    }
    return id ? `background-modal/${id}.gif` : null;
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
