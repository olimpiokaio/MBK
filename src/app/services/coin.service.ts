import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SelosService } from './selos.service';
import { UserDataService } from './user-data.service';

/**
 * CoinService
 * Gerencia a moeda cosmética do app (MB Coin).
 * Regras:
 * - +1 coin por vitória em partida.
 * - +5 coins por troféu/selo conquistado.
 * Persistência agora no Firebase Realtime Database (users/{uid}/stats.coins).
 */
@Injectable({ providedIn: 'root' })
export class CoinService {
  private balance$ = new BehaviorSubject<number>(0);

  /** Observable para a UI exibir saldo em tempo real */
  readonly balanceObservable = this.balance$.asObservable();

  private userData = inject(UserDataService);

  constructor(private selos: SelosService) {
    // Carrega saldo inicial do Firebase
    this.initFromDb();
    // Toda vez que um selo é conquistado, adicionar +5 moedas
    try {
      this.selos.earned$.subscribe(() => this.addCoins(5));
    } catch {}
  }

  private async initFromDb() {
    try {
      const stats = await this.userData.getStatsOnce();
      this.balance$.next(stats.coins || 0);
    } catch {}
  }

  /** Lê o saldo atual (valor imediato) */
  getBalance(): number { return this.balance$.value; }

  /** Define explicitamente o saldo (clamp >= 0) e persiste no Firebase */
  async setBalance(n: number) {
    const val = Math.max(0, Math.floor(n || 0));
    this.balance$.next(val);
    try { await this.userData.updateStats({ coins: val }); } catch {}
  }

  /** Adiciona (ou subtrai) moedas. Retorna o novo saldo e persiste no Firebase. */
  addCoins(delta: number): number {
    const next = Math.max(0, this.getBalance() + Math.floor(delta || 0));
    this.balance$.next(next);
    // Persistir em background
    this.userData.updateStats({ coins: next }).catch(() => {});
    return next;
  }
}
