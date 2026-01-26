import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ProfileService } from './profile.service';

/**
 * SelosService
 * Responsável por armazenar e consultar os selos (badges) conquistados pelo jogador atual
 * e alguns contadores auxiliares (vitórias consecutivas), utilizando localStorage.
 *
 * OBS: A referência ao nome do usuário no localStorage foi removida. Agora o nome
 * vem do ProfileService (que lê do Firebase Realtime Database via AuthService).
 */
@Injectable({ providedIn: 'root' })
export class SelosService {
  private readonly STORAGE_KEY = 'mbk.selos.earned';
  private readonly WINS_STREAK_KEY = 'mbk.selos.winStreak';

  private profile = inject(ProfileService);

  /** Evento emitido quando um selo é conquistado pela primeira vez neste dispositivo. */
  private earnedSubject = new Subject<{ id: string; at: number }>();
  /** Observable público para que a UI possa reagir (ex.: mostrar animação estilo PlayStation). */
  readonly earned$: Observable<{ id: string; at: number }> = this.earnedSubject.asObservable();

  /** Retorna o nome do jogador atual, derivado do ProfileService (Firebase). */
  get currentPlayerName(): string | null {
    const prof = this.profile.profile();
    const name = prof.name?.trim();
    return name ? name : null;
  }

  /** Mantido por compatibilidade; não persiste mais em localStorage. */
  setCurrentPlayerName(name: string | null) {
    // No-op: nome atual é derivado do ProfileService/AuthService
  }

  /** Lê o conjunto de selos conquistados. */
  getEarned(): Set<string> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw);
      return new Set<string>(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set<string>();
    }
  }

  /** Persiste o conjunto de selos conquistados. */
  private saveEarned(set: Set<string>) {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(set))); } catch {}
  }

  /** Verifica se o selo foi conquistado. */
  has(id: string): boolean { return this.getEarned().has(id); }

  /** Marca um selo como conquistado. Retorna true se gravou (novo). */
  earn(id: string): boolean {
    if (!id) return false;
    const set = this.getEarned();
    if (set.has(id)) return false;
    set.add(id);
    this.saveEarned(set);
    // Emite evento para a UI reagir
    try { this.earnedSubject.next({ id, at: Date.now() }); } catch {}
    return true;
  }

  /** Remove todos os selos (debug). */
  resetAll() { this.saveEarned(new Set()); }

  // ===== VITÓRIAS CONSECUTIVAS =====
  getWinStreak(): number {
    try { return parseInt(localStorage.getItem(this.WINS_STREAK_KEY) || '0', 10) || 0; } catch { return 0; }
  }
  setWinStreak(n: number) { try { localStorage.setItem(this.WINS_STREAK_KEY, String(Math.max(0, Math.floor(n)))); } catch {} }
  incWinStreak(): number { const n = this.getWinStreak() + 1; this.setWinStreak(n); return n; }
  resetWinStreak() { this.setWinStreak(0); }
}
