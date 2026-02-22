import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Player } from '../types/player.model';

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-edit-modal.component.html',
  styleUrls: ['./user-edit-modal.component.css']
})
export class UserEditModalComponent {
  @Input() player!: Player;
  @Output() save = new EventEmitter<{ playerName: string; avatarUrl: string }>();
  @Output() close = new EventEmitter<void>();

  name = '';
  avatarUrl = '';

  ngOnChanges(): void {
    this.name = this.player?.playerName ?? '';
    this.avatarUrl = this.player?.playerImage ?? '';
  }

  onSave(): void {
    const name = (this.name || '').trim();
    const avatarUrl = (this.avatarUrl || '').trim();
    if (!name) {
      return;
    }
    // Agora quem persiste é o HomeComponent/ProfileService -> Realtime Database
    this.save.emit({ playerName: name, avatarUrl });
  }

  onClose(): void {
    this.close.emit();
  }
}
