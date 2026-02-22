import { Injectable, inject } from '@angular/core';
import { Database, get, ref, set, update } from '@angular/fire/database';
import { AuthService } from './auth.service';

export type UserStats = { level: number; totalPoints: number; coins: number };
export type UserStore = {
  purchased: { backgrounds: Record<string, true> };
  applied: { background: string | null };
};

const DEFAULT_STATS: UserStats = { level: 1, totalPoints: 0, coins: 0 };
const DEFAULT_STORE: UserStore = { purchased: { backgrounds: {} }, applied: { background: null } };

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private db = inject(Database);
  private auth = inject(AuthService);

  private uid(): string | null {
    const u = this.auth.currentUser();
    return u?.uid ?? null;
  }

  // ====== STATS ======
  async getStatsOnce(): Promise<UserStats> {
    const uid = this.uid();
    if (!uid) return { ...DEFAULT_STATS };
    const node = ref(this.db, `users/${uid}/stats`);
    const snap = await get(node);
    if (!snap.exists()) {
      await set(node, DEFAULT_STATS);
      return { ...DEFAULT_STATS };
    }
    const val = snap.val() as Partial<UserStats>;
    return {
      level: typeof val.level === 'number' ? val.level : 1,
      totalPoints: typeof val.totalPoints === 'number' ? val.totalPoints : 0,
      coins: typeof val.coins === 'number' ? val.coins : 0,
    };
  }

  async updateStats(partial: Partial<UserStats>): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    await update(ref(this.db, `users/${uid}/stats`), { ...partial, updatedAt: Date.now() });
  }

  async setLevel(level: number): Promise<void> {
    await this.updateStats({ level: Math.max(0, Math.floor(level || 0)) });
  }

  async addPoints(delta: number): Promise<number> {
    const stats = await this.getStatsOnce();
    const totalPoints = Math.max(0, (stats.totalPoints || 0) + Math.floor(delta || 0));
    await this.updateStats({ totalPoints });
    return totalPoints;
  }

  // ====== STORE (BACKGROUND) ======
  async getStoreOnce(): Promise<UserStore> {
    const uid = this.uid();
    if (!uid) return { ...DEFAULT_STORE, purchased: { backgrounds: {} } };
    const node = ref(this.db, `users/${uid}/store`);
    const snap = await get(node);
    if (!snap.exists()) {
      await set(node, DEFAULT_STORE);
      return { ...DEFAULT_STORE };
    }
    const val = snap.val() as any;
    return {
      purchased: { backgrounds: (val?.purchased?.backgrounds ?? {}) as Record<string, true> },
      applied: { background: (val?.applied?.background ?? null) as string | null },
    };
  }

  async purchaseBackground(id: string): Promise<void> {
    const uid = this.uid();
    if (!uid || !id) return;
    await set(ref(this.db, `users/${uid}/store/purchased/backgrounds/${id}`), true);
  }

  async applyBackground(id: string | null): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    await update(ref(this.db, `users/${uid}/store/applied`), { background: id ?? null, updatedAt: Date.now() });
  }

  async getAppliedBackgroundIdOnce(): Promise<string | null> {
    const uid = this.uid();
    if (!uid) return null;
    const snap = await get(ref(this.db, `users/${uid}/store/applied/background`));
    return snap.exists() ? (snap.val() as string) : null;
  }
}
