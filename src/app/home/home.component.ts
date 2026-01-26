import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardPlayComponent } from "../shared/card-play/card-play.component";
import { Player } from '../shared/types/player.model';
import { SelosService } from '../services/selos.service';
import { FooterComponent } from "../footer/footer.component";
import { AuthService } from '../services/auth.service';
import { UserEditModalComponent } from "../shared/user-edit-modal/user-edit-modal.component";
import { NgIf } from '@angular/common';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardPlayComponent, RouterLink, FooterComponent, UserEditModalComponent, NgIf],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  private auth = inject(AuthService);
  private selos = inject(SelosService);
  private profile = inject(ProfileService);

  isEditOpen = false;

  // Será preenchido com dados do usuário logado
  player = new Player(
    'Jogador',
    'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg',
    18,
    1,
    0
  );

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }

    const username = user.username;
    const age = this.calcAge(user.dob);
    const { level, totalPoints } = this.loadStats(username);

    this.player = new Player(
      username,
      'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg',
      age,
      level,
      totalPoints
    );

    // Aplicar overrides salvos (nome e avatar)
    try {
      const raw = localStorage.getItem('mbk.profile.override');
      if (raw) {
        const { name, avatar } = JSON.parse(raw) as { name?: string; avatar?: string };
        if (name) this.player.playerName = name;
        if (avatar) this.player.playerImage = avatar;
      }
    } catch {}

    try { this.selos.setCurrentPlayerName(this.player.playerName); } catch {}

    // Propaga perfil globalmente
    try { this.profile.setProfile(this.player.playerName, this.player.playerImage); } catch {}
  }

  private calcAge(dobIso: string): number {
    const dob = new Date(dobIso);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return Math.max(0, age);
  }

  private loadStats(username: string): { level: number; totalPoints: number } {
    try {
      const raw = localStorage.getItem(`mbk.stats.${username}`);
      if (raw) {
        const obj = JSON.parse(raw) as { level?: number; totalPoints?: number };
        return { level: obj.level ?? 1, totalPoints: obj.totalPoints ?? 0 };
      }
    } catch {}
    return { level: 1, totalPoints: 0 };
  }

  openEdit(): void {
    this.isEditOpen = true;
  }

  onPlayerSave(evt: { playerName: string; avatarUrl: string }): void {
    const oldName = this.player.playerName;

    // Aplica alterações no objeto em memória
    this.player.playerName = evt.playerName;
    if (evt.avatarUrl) this.player.playerImage = evt.avatarUrl;

    // Se o nome mudou, migrar estatísticas salvas para a nova chave
    if (oldName && oldName !== this.player.playerName) {
      try {
        const oldKey = `mbk.stats.${oldName}`;
        const newKey = `mbk.stats.${this.player.playerName}`;
        const raw = localStorage.getItem(oldKey);
        if (raw && !localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, raw);
        }
        if (raw) {
          localStorage.removeItem(oldKey);
        }
      } catch {}
    }

    // Atualiza serviços dependentes do nome/avatar (também persiste override do perfil)
    try { this.selos.setCurrentPlayerName(this.player.playerName); } catch {}
    try { this.profile.setProfile(this.player.playerName, this.player.playerImage); } catch {}

    // Sincroniza com o usuário logado (AuthService)
    try { this.auth.updateCurrentUser({ username: this.player.playerName, avatar: this.player.playerImage }); } catch {}

    this.isEditOpen = false;
  }
}
