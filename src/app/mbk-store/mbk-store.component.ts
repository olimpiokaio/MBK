import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { CoinService } from '../services/coin.service';
import { Subscription } from 'rxjs';
import { SelosService } from '../services/selos.service';

type StoreItem = { id: string; name: string; src: string; cost: number };

@Component({
  selector: 'app-mbk-store',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './mbk-store.component.html',
  styleUrl: './mbk-store.component.css'
})
export class MbkStoreComponent implements OnDestroy {
  balance = 0;
  private sub?: Subscription;

  readonly COST = 10;
  readonly STORAGE_KEY = 'mbk.store.purchased.backgrounds';
  readonly APPLIED_KEY_BASE = 'mbk.store.applied.background';

  // Lista de GIFs disponíveis na pasta public/backgrond-modal
  items: StoreItem[] = [
    'animal-jam.gif',
    'balling.gif',
    'breakin-bad-2.gif',
    'breaking-bad.gif',
    'daffy-duck-looney-tunes.gif',
    'diadop.gif',
    'diana-taurasi.gif',
    'emo.gif',
    'kira-yoshikage.gif',
    'legend-optimus-prime.gif',
    'lola-bunny.gif',
    'male.gif',
    'nancysaey.gif',
    'ny.gif',
    'saul-goodman.gif',
    'space-Jam-Monstars.gif',
    'trikey-drama.gif',
  ].map((file) => ({ id: file, name: file.replace('.gif',''), src: `/backgrond-modal/${file}`, cost: this.COST }));

  private purchasedSet = new Set<string>(this.readPurchased());

  constructor(private coins: CoinService, private selos: SelosService) {
    this.balance = this.coins.getBalance();
    this.sub = this.coins.balanceObservable.subscribe(v => this.balance = v);
  }

  isPurchased(item: StoreItem): boolean {
    return this.purchasedSet.has(item.id);
  }

  canBuy(item: StoreItem): boolean {
    return !this.isPurchased(item) && this.balance >= item.cost;
  }

  buy(item: StoreItem) {
    if (!this.canBuy(item)) return;
    this.coins.addCoins(-item.cost);
    this.purchasedSet.add(item.id);
    this.persistPurchased();
  }

  // === APLICAR/REMOVER BG ===
  private appliedKeyForCurrent(): string {
    const player = this.selos.currentPlayerName;
    return player ? `${this.APPLIED_KEY_BASE}.${player}` : this.APPLIED_KEY_BASE;
  }

  getAppliedId(): string | null {
    try { return localStorage.getItem(this.appliedKeyForCurrent()); } catch { return null; }
  }

  isApplied(item: StoreItem): boolean {
    return this.getAppliedId() === item.id;
  }

  apply(item: StoreItem) {
    if (!this.isPurchased(item)) return;
    try { localStorage.setItem(this.appliedKeyForCurrent(), item.id); } catch {}
  }

  clearApplied() {
    try { localStorage.removeItem(this.appliedKeyForCurrent()); } catch {}
  }

  private readPurchased(): string[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  private persistPurchased() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.purchasedSet)));
    } catch {}
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
