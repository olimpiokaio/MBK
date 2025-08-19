import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SelosService } from './selos.service';

/**
 * CoinService
 * Gerencia a moeda cosmética do app (MB Coin).
 * Regras:
 * - +1 coin por vitória em partida.
 * - +5 coins por troféu/selo conquistado.
 * Persistência simples em localStorage.
 */
@Injectable({ providedIn: 'root' })
export class CoinService {
  private readonly STORAGE_KEY = 'mbk.coins.balance';

  private balance$ = new BehaviorSubject<number>(this.readStored());

  /** Observable para a UI exibir saldo em tempo real */
  readonly balanceObservable = this.balance$.asObservable();

  constructor(private selos: SelosService) {
    // Toda vez que um selo é conquistado, adicionar +5 moedas
    try {
      this.selos.earned$.subscribe(() => this.addCoins(5));
    } catch {}
  }

  /** Lê o saldo atual (valor imediato) */
  getBalance(): number { return this.balance$.value; }

  /** Define explicitamente o saldo (clamp >= 0) */
  setBalance(n: number) {
    const val = Math.max(0, Math.floor(n || 0));
    this.balance$.next(val);
    this.persist(val);
  }

  /** Adiciona (ou subtrai) moedas. Retorna o novo saldo. */
  addCoins(delta: number): number {
    const next = Math.max(0, this.getBalance() + Math.floor(delta || 0));
    this.balance$.next(next);
    this.persist(next);
    return next;
  }

  // Helpers
  private readStored(): number {
    try { return parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10) || 0; } catch { return 0; }
  }
  private persist(n: number) { try { localStorage.setItem(this.STORAGE_KEY, String(n)); } catch {} }
}
