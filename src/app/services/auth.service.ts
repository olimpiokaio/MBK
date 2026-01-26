import { Injectable, computed, signal } from '@angular/core';

export type User = {
  email: string;
  dob: string; // ISO date string (yyyy-mm-dd)
  username: string;
  password: string; // demo only (não use em produção)
  avatar?: string; // URL do avatar (opcional)
};

const USERS_KEY = 'mbk.auth.users';
const CURRENT_KEY = 'mbk.auth.current';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usersSig = signal<User[]>(this.loadUsers());
  private currentSig = signal<User | null>(this.loadCurrent());

  users = computed(() => this.usersSig());
  currentUser = computed(() => this.currentSig());
  isLoggedIn = computed(() => this.currentSig() !== null);

  register(data: { email: string; dob: string; username: string; password: string }): { ok: true } | { ok: false; error: string } {
    const { email, dob, username, password } = data;

    if (!email || !dob || !username || !password) {
      return { ok: false, error: 'Preencha todos os campos.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'E-mail inválido.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
    }

    const users = this.usersSig();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Já existe uma conta com este e-mail.' };
    }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, error: 'Já existe uma conta com este nome de usuário.' };
    }

    const newUser: User = { email, dob, username, password };
    const next = [...users, newUser];
    this.usersSig.set(next);
    this.persistUsers(next);

    // autentica automaticamente após cadastro
    this.currentSig.set(newUser);
    this.persistCurrent(newUser);

    return { ok: true };
  }

  login(identifier: string, password: string): { ok: true; user: User } | { ok: false; error: string } {
    if (!identifier || !password) {
      return { ok: false, error: 'Informe usuário/e-mail e senha.' };
    }
    const users = this.usersSig();
    const idLower = identifier.toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower);
    if (!user || user.password !== password) {
      return { ok: false, error: 'Credenciais inválidas.' };
    }
    this.currentSig.set(user);
    this.persistCurrent(user);
    return { ok: true, user };
  }

  /** Atualiza o usuário logado e persiste em localStorage (lista e usuário atual). */
  updateCurrentUser(partial: Partial<User>): void {
    const curr = this.currentSig();
    if (!curr) return;
    const updated: User = { ...curr, ...partial } as User;
    this.currentSig.set(updated);
    this.persistCurrent(updated);

    const users = this.usersSig();
    const idx = users.findIndex(u => u.email.toLowerCase() === curr.email.toLowerCase());
    if (idx >= 0) {
      const next = [...users];
      next[idx] = updated;
      this.usersSig.set(next);
      this.persistUsers(next);
    }
  }

  logout(): void {
    this.currentSig.set(null);
    try { localStorage.removeItem(CURRENT_KEY); } catch {}
  }

  private loadUsers(): User[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) as User[] : [];
    } catch { return []; }
  }

  private persistUsers(users: User[]) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
  }

  private loadCurrent(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch { return null; }
  }

  private persistCurrent(user: User | null) {
    try {
      if (user) localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
      else localStorage.removeItem(CURRENT_KEY);
    } catch {}
  }
}
