import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SelosService } from './selos.service';
import { UserDataService } from './user-data.service';
import { AuthService } from './auth.service';

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
  private balance$ = new BehaviorSubject<number | null>(null);

  /** Observable para a UI exibir saldo em tempo real */
  readonly balanceObservable = this.balance$.asObservable();

  private userData = inject(UserDataService);
  private auth = inject(AuthService);
  private initialized = false;

  constructor(private selos: SelosService) {
    // Aguarda autenticação antes de carregar saldo do Firebase
    this.initFromDb();
    // Toda vez que um selo é conquistado, adicionar +5 moedas
    try {
      this.selos.earned$.subscribe(() => this.addCoins(5));
    } catch {}
  }

  private async initFromDb() {
    try {
      // Aguarda até que o usuário esteja autenticado
      await this.waitForAuth();
      const stats = await this.userData.getStatsOnce();
      this.balance$.next(stats.coins || 0);
      this.initialized = true;
    } catch {
      // Em caso de erro, inicializa com 0
      this.balance$.next(0);
      this.initialized = true;
    }
  }

  /** Aguarda até que o AuthService tenha um usuário autenticado */
  private async waitForAuth(): Promise<void> {
    return new Promise((resolve) => {
      // Se já está logado, resolve imediatamente
      if (this.auth.isLoggedIn()) {
        resolve();
        return;
      }
      // Caso contrário, aguarda o signal mudar
      const checkAuth = () => {
        if (this.auth.isLoggedIn()) {
          resolve();
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  /** Lê o saldo atual (valor imediato) */
  getBalance(): number { return this.balance$.value ?? 0; }

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
