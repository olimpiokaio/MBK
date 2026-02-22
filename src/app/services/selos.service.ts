import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Database, ref, onValue, update, get } from '@angular/fire/database';
import { Observable, Subject } from 'rxjs';
import { ProfileService } from './profile.service';
import { AuthService } from './auth.service';

/**
 * SelosService
 * Responsável por gerenciar os selos (badges) conquistados pelo jogador,
 * persistindo os dados no Firebase Realtime Database.
 */
@Injectable({ providedIn: 'root' })
export class SelosService {
  private readonly db = inject(Database);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);

  private readonly STORAGE_KEY = 'mbk.selos.earned';
  private readonly WINS_STREAK_KEY = 'mbk.selos.winStreak';

  private earnedSig = signal<Set<string>>(new Set());
  private winStreakSig = signal<number>(0);

  /** Signal público para os selos conquistados. */
  earned = computed(() => this.earnedSig());
  /** Signal público para a sequência de vitórias. */
  winStreak = computed(() => this.winStreakSig());

  private earnedSubject = new Subject<{ id: string; at: number }>();
  /** Observable para a UI reagir a novas conquistas (ex: animações). */
  readonly earned$: Observable<{ id: string; at: number }> = this.earnedSubject.asObservable();

  constructor() {
    // Escuta mudanças no usuário autenticado para sincronizar com o Firebase
    effect(() => {
      const user = this.auth.currentUser();
      if (user && user.uid) {
        this.syncWithFirebase(user.uid);
        this.migrateLocalStorage(user.uid);
      } else {
        this.earnedSig.set(new Set());
        this.winStreakSig.set(0);
      }
    }, { allowSignalWrites: true });
  }

  private syncWithFirebase(uid: string) {
    const achievementsRef = ref(this.db, `users/${uid}/achievements`);
    onValue(achievementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const earnedIds = data.earned ? Object.keys(data.earned) : [];
        this.earnedSig.set(new Set(earnedIds));
        this.winStreakSig.set(data.winStreak || 0);
      }
    });
  }

  /** Migra dados do localStorage para o Firebase (executado uma vez por login). */
  private async migrateLocalStorage(uid: string) {
    try {
      const localEarnedRaw = localStorage.getItem(this.STORAGE_KEY);
      const localWinStreakRaw = localStorage.getItem(this.WINS_STREAK_KEY);

      if (!localEarnedRaw && !localWinStreakRaw) return;

      const updates: any = {};

      if (localEarnedRaw) {
        const localEarnedArr = JSON.parse(localEarnedRaw);
        if (Array.isArray(localEarnedArr)) {
          localEarnedArr.forEach(id => {
            updates[`earned/${id}`] = true;
          });
        }
      }

      if (localWinStreakRaw) {
        const streak = parseInt(localWinStreakRaw, 10);
        if (!isNaN(streak)) {
          // Mantém o maior valor (local vs firebase)
          const currentStreak = this.winStreakSig();
          updates['winStreak'] = Math.max(streak, currentStreak);
        }
      }

      if (Object.keys(updates).length > 0) {
        updates['updatedAt'] = Date.now();
        await update(ref(this.db, `users/${uid}/achievements`), updates);

        // Limpa localStorage após migração bem sucedida
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.WINS_STREAK_KEY);
      }
    } catch (err) {
      console.error('Erro na migração de selos:', err);
    }
  }

  get currentPlayerName(): string | null {
    const prof = this.profile.profile();
    return prof.name?.trim() || null;
  }

  /** Verifica se o selo foi conquistado. */
  has(id: string): boolean {
    return this.earnedSig().has(id);
  }

  /** Marca um selo como conquistado no Firebase. */
  async earn(id: string): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user || !user.uid || !id) return false;

    if (this.earnedSig().has(id)) return false;

    const path = `users/${user.uid}/achievements/earned`;
    await update(ref(this.db, path), { [id]: true });
    await update(ref(this.db, `users/${user.uid}/achievements`), { updatedAt: Date.now() });

    this.earnedSubject.next({ id, at: Date.now() });
    return true;
  }

  async setWinStreak(n: number) {
    const user = this.auth.currentUser();
    if (!user || !user.uid) return;

    const val = Math.max(0, Math.floor(n));
    await update(ref(this.db, `users/${user.uid}/achievements`), {
      winStreak: val,
      updatedAt: Date.now()
    });
  }

  async incWinStreak(): Promise<number> {
    const current = this.winStreakSig();
    const next = current + 1;
    await this.setWinStreak(next);
    return next;
  }

  async resetWinStreak() {
    await this.setWinStreak(0);
  }

  /** Remove todos os selos do usuário atual (debug). */
  async resetAll() {
    const user = this.auth.currentUser();
    if (!user || !user.uid) return;
    await update(ref(this.db, `users/${user.uid}/achievements`), {
      earned: null,
      winStreak: 0,
      updatedAt: Date.now()
    });
  }
}
