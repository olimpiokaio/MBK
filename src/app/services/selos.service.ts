import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * SelosService
 * Responsável por armazenar e consultar os selos (badges) conquistados pelo jogador atual
 * e alguns contadores auxiliares (vitórias consecutivas), utilizando localStorage.
 */
@Injectable({ providedIn: 'root' })
export class SelosService {
  private readonly STORAGE_KEY = 'mbk.selos.earned';
  private readonly WINS_STREAK_KEY = 'mbk.selos.winStreak';
  private readonly CURRENT_PLAYER_KEY = 'mbk.currentPlayerName';

  /** Evento emitido quando um selo é conquistado pela primeira vez neste dispositivo. */
  private earnedSubject = new Subject<{ id: string; at: number }>();
  /** Observable público para que a UI possa reagir (ex.: mostrar animação estilo PlayStation). */
  readonly earned$: Observable<{ id: string; at: number }> = this.earnedSubject.asObservable();

  /** Retorna o nome do jogador "atual" (salvo pela Home). */
  get currentPlayerName(): string | null {
    try { return localStorage.getItem(this.CURRENT_PLAYER_KEY); } catch { return null; }
  }

  /** Atualiza o jogador atual (pode ser chamado pela Home). */
  setCurrentPlayerName(name: string | null) {
    try {
      if (name && name.trim()) localStorage.setItem(this.CURRENT_PLAYER_KEY, name.trim());
      else localStorage.removeItem(this.CURRENT_PLAYER_KEY);
    } catch {}
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
