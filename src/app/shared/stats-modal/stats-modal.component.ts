import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardQualificacaoComponent } from '../card-qualificacao/card-qualificacao.component';
import { Player } from '../types/player.model';

@Component({
  selector: 'app-stats-modal',
  standalone: true,
  imports: [CommonModule, CardQualificacaoComponent],
  templateUrl: './stats-modal.component.html',
  styleUrls: ['./stats-modal.component.css'],
})
export class StatsModalComponent {
  @Input({ required: true }) open: boolean = false;

  @Input() mvpPlayer: Player | null = null;
  @Input() topScorerPlayer: Player | null = null;
  @Input() bestPlayer: Player | null = null;

  // Function inputs to keep logic minimal in parent while componentizing UI
  @Input() teamFor: (p: Player) => Player[] = () => [];
  @Input() pointsRecord: Record<string, number> = {};
  @Input() getPlayerMatchPoints: (p: Player) => number = () => 0;

  @Output() close = new EventEmitter<void>();

  // Local computed guards for template convenience
  hasMvp = computed(() => !!this.mvpPlayer);
  hasTop = computed(() => !!this.topScorerPlayer);

  onOverlayClick() {
    this.close.emit();
  }

  stopProp(e: MouseEvent) {
    e.stopPropagation();
  }
}
