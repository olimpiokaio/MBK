import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export type Profile = { name: string; avatar: string };

const OVERRIDE_KEY = 'mbk.profile.override';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private auth = inject(AuthService);

  private profileSig = signal<Profile>({ name: '', avatar: '' });
  profile = computed(() => this.profileSig());

  constructor() {
    this.initFromSources();
  }

  /** Atualiza o perfil em memória e persiste em localStorage (override). */
  setProfile(name: string, avatar: string) {
    const next: Profile = { name: name?.trim() || '', avatar: avatar?.trim() || '' };
    this.profileSig.set(next);
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ name: next.name, avatar: next.avatar })); } catch {}
  }

  /** Recarrega perfil com base no usuário autenticado e no override salvo. */
  refresh() { this.initFromSources(); }

  private initFromSources() {
    const user = this.auth.currentUser();
    let name = user?.username ?? '';
    let avatar = 'https://i.pinimg.com/originals/a4/0a/db/a40adbb4e98486e06a57bc75c4b06600.jpg';

    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      if (raw) {
        const { name: n, avatar: a } = JSON.parse(raw) as { name?: string; avatar?: string };
        if (n) name = n;
        if (a) avatar = a;
      }
    } catch {}

    this.profileSig.set({ name, avatar });
  }
}
