import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-modal.component.html',
  styleUrls: ['./logout-modal.component.css']
})
export class LogoutModalComponent {
  @Input() open = false;
  @Input() title = 'SAIR DO MBK?';
  @Input() description = 'Deseja realmente encerrar sua sessão?';
  @Input() confirmText = 'SAIR AGORA';
  @Input() cancelText = 'VOLTAR';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOverlayClick() {
    this.cancel.emit();
  }

  onCardClick(event: MouseEvent) {
    event.stopPropagation();
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
