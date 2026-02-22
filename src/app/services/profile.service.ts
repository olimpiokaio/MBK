import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type Profile = { name: string; avatar: string };

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private auth = inject(AuthService);

  private readonly defaultAvatar = 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg';

  // Perfil é derivado diretamente do usuário autenticado (DB) — sem localStorage
  profile = computed<Profile>(() => {
    const u = this.auth.currentUser();
    return {
      name: u?.username ?? '',
      avatar: (u?.avatar && u.avatar.trim()) ? u.avatar : this.defaultAvatar,
    };
  });

  /** Atualiza o perfil no Realtime Database (via AuthService). */
  async setProfile(name: string, avatar: string) {
    await this.auth.updateCurrentUser({ username: (name || '').trim(), avatar: (avatar || '').trim() });
  }

  /** Mantido por compatibilidade; sem efeito pois agora é derivado do AuthService. */
  refresh() { /* no-op */ }
}
