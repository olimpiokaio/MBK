import { Injectable, computed, signal } from '@angular/core';
import { Auth, User as FbUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from '@angular/fire/auth';
import { Database, get, ref, set, update } from '@angular/fire/database';

export type User = {
  email: string;
  dob: string; // ISO date string (yyyy-mm-dd)
  username: string;
  avatar?: string; // URL do avatar (opcional)
  uid?: string; // id do firebase
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentSig = signal<User | null>(null);

  currentUser = computed(() => this.currentSig());
  isLoggedIn = computed(() => this.currentSig() !== null);

  constructor(private auth: Auth, private db: Database) {
    onAuthStateChanged(this.auth, (u) => {
      this.hydrateFromFirebase(u).then(user => this.currentSig.set(user));
    });
  }

  // Cadastro com e-mail/senha + campos extras
  async register(data: { email: string; dob: string; username: string; password: string }): Promise<void> {
    const { email, dob, username, password } = data;
    if (!email || !dob || !username || !password) throw new Error('Preencha todos os campos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail inválido.');
    if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');

    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    try { await updateProfile(cred.user, { displayName: username }); } catch {}

    // Escreve perfil inicial no Realtime Database
    const uid = cred.user.uid;
    const profile: User = { email, dob, username, avatar: '', uid };
    await set(ref(this.db, `users/${uid}`), {
      email: profile.email,
      username: profile.username,
      dob: profile.dob,
      avatar: profile.avatar || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    // Inicializa nós padrão para stats e store
    await set(ref(this.db, `users/${uid}/stats`), { level: 1, totalPoints: 0, coins: 0, updatedAt: Date.now() });
    await set(ref(this.db, `users/${uid}/store`), { purchased: { backgrounds: {} }, applied: { background: null }, updatedAt: Date.now() });
    await set(ref(this.db, `users/${uid}/achievements`), { earned: {}, winStreak: 0, updatedAt: Date.now() });
    // currentSig será atualizado pelo onAuthStateChanged
  }

  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const user = await this.hydrateFromFirebase(cred.user);
    this.currentSig.set(user);
    return user!;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentSig.set(null);
  }

  /** Atualiza o usuário logado e persiste no Realtime Database. */
  async updateCurrentUser(partial: Partial<User>): Promise<void> {
    const curr = this.currentSig();
    if (!curr || !curr.uid) return;
    const updated: User = { ...curr, ...partial } as User;
    this.currentSig.set(updated);
    await update(ref(this.db, `users/${curr.uid}`), {
      username: updated.username,
      dob: updated.dob,
      avatar: updated.avatar || '',
      updatedAt: Date.now(),
    });
  }

  // Helpers
  private async hydrateFromFirebase(u: FbUser | null): Promise<User | null> {
    if (!u) return null;
    const uid = u.uid;
    const userRef = ref(this.db, `users/${uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) {
      // Inicializa perfil básico se não existir
      const fallback: User = {
        uid,
        email: u.email || '',
        username: u.displayName || (u.email?.split('@')[0] ?? ''),
        dob: '2000-01-01',
        avatar: ''
      };
      await set(userRef, {
        email: fallback.email,
        username: fallback.username,
        dob: fallback.dob,
        avatar: fallback.avatar,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return fallback;
    }
    const val = snap.val() as any;
    const profile: User = {
      uid,
      email: val.email || u.email || '',
      username: val.username || u.displayName || (u.email?.split('@')[0] ?? ''),
      dob: val.dob || '2000-01-01',
      avatar: val.avatar || ''
    };
    return profile;
  }
}
