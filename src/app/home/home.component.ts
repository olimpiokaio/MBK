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
import { UserDataService } from '../services/user-data.service';

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
  private userData = inject(UserDataService);

  isEditOpen = false;

  // Será preenchido com dados do usuário logado
  player = new Player(
    'Jogador',
    'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg',
    18,
    1,
    0
  );

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }

    const prof = this.profile.profile();
    const username = prof.name || user.username;
    const avatar = prof.avatar || 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg';
    const age = this.calcAge(user.dob);

    const stats = await this.userData.getStatsOnce();

    this.player = new Player(
      username,
      avatar,
      age,
      stats.level ?? 1,
      stats.totalPoints ?? 0
    );

    try { this.selos.setCurrentPlayerName(this.player.playerName); } catch {}
  }

  private calcAge(dobIso: string): number {
    const dob = new Date(dobIso);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return Math.max(0, age);
  }

  openEdit(): void {
    this.isEditOpen = true;
  }

  onPlayerSave(evt: { playerName: string; avatarUrl: string }): void {
    const oldName = this.player.playerName;

    // Aplica alterações no objeto em memória
    this.player.playerName = evt.playerName;
    if (evt.avatarUrl) this.player.playerImage = evt.avatarUrl;

    // Removida migração de localStorage: stats agora vêm do Firebase

    // Atualiza serviços dependentes do nome/avatar (também persiste override do perfil)
    try { this.selos.setCurrentPlayerName(this.player.playerName); } catch {}
    try { this.profile.setProfile(this.player.playerName, this.player.playerImage); } catch {}

    // Sincroniza com o usuário logado (AuthService)
    try { this.auth.updateCurrentUser({ username: this.player.playerName, avatar: this.player.playerImage }); } catch {}

    this.isEditOpen = false;
  }
}
