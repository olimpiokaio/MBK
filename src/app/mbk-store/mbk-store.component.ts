import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { CoinService } from '../services/coin.service';
import { Subscription } from 'rxjs';
import { SelosService } from '../services/selos.service';
import { FooterComponent } from "../footer/footer.component";
import { UserDataService } from '../services/user-data.service';

type StoreItem = { id: string; name: string; src: string; cost: number };

@Component({
  selector: 'app-mbk-store',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FooterComponent],
  templateUrl: './mbk-store.component.html',
  styleUrl: './mbk-store.component.css'
})
export class MbkStoreComponent implements OnDestroy, AfterViewInit {
  @ViewChild('carouselContainer') private carouselContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('carouselTrack') private carouselTrack?: ElementRef<HTMLDivElement>;
  balance = 0;
  // Valor exibido com animação
  displayBalance = 0;
  // Flag para classe de animação visual ao gastar
  spendingPulse = false;
  private sub?: Subscription;

  readonly COST = 10;

  // Lista de GIFs disponíveis na pasta public/background-modal
  items: StoreItem[] = [
    'animal-jam.gif',
    'balling.gif',
    'batman.gif',
    'breakin-bad-2.gif',
    'breaking-bad.gif',
    'canes-cup.gif',
    'crazy-traffic.gif',
    'daffy-duck-looney-tunes.gif',
    'darth-vader-star-wars.gif',
    'death-note-character.gif',
    'diadop.gif',
    'diana-taurasi.gif',
    'elden-ring.gif',
    'emo.gif',
    'goku.gif',
    'gothic-joker.gif',
    'itachi-uchiha.gif',
    'kira-yoshikage.gif',
    'legend-optimus-prime.gif',
    'light-yagami-and-misa-amane.gif',
    'lola-bunny.gif',
    'male.gif',
    'mei-misaki-another.gif',
    'nancysaey.gif',
    'ny.gif',
    'saul-goodman.gif',
    'shaggy-scooby-doo.gif',
    'space-Jam-Monstars.gif',
    'the-nyan-cat.gif',
    'trikey-drama.gif',
    'wawa.gif',
  ].map((file) => ({ id: file, name: file.replace('.gif',''), src: `background-modal/${file}`, cost: this.COST }));

  private purchasedSet = new Set<string>();
  private appliedId: string | null = null;

  constructor(private coins: CoinService, private selos: SelosService, private userData: UserDataService) {
    // Não ler saldo síncrono aqui - aguardar o observable carregar do Firebase
    this.sub = this.coins.balanceObservable.subscribe(v => {
      // Ignora valores null (ainda não carregado do Firebase)
      if (v === null) return;

      const prevDisplay = this.displayBalance;
      this.balance = v;
      // Anima somente quando diminuir (compra), senão atualiza direto
      if (v < prevDisplay) {
        this.animateDisplayBalance(prevDisplay, v, 600);
      } else {
        this.displayBalance = v;
      }
    });

    // Carregar compras e aplicado do Firebase
    this.initStoreFromDb();
  }

  private async initStoreFromDb() {
    try {
      const store = await this.userData.getStoreOnce();
      this.purchasedSet = new Set<string>(Object.keys(store.purchased.backgrounds || {}));
      this.appliedId = store.applied.background ?? null;
    } catch {}
  }

  isPurchased(item: StoreItem): boolean {
    return this.purchasedSet.has(item.id);
  }

  canBuy(item: StoreItem): boolean {
    return !this.isPurchased(item) && this.balance >= item.cost;
  }

  async buy(item: StoreItem) {
    if (!this.canBuy(item)) return;
    this.coins.addCoins(-item.cost);
    this.purchasedSet.add(item.id);
    try { await this.userData.purchaseBackground(item.id); } catch {}
    this.triggerSpendPulse();
  }

  // === APLICAR/REMOVER BG ===
  getAppliedId(): string | null {
    return this.appliedId;
  }

  isApplied(item: StoreItem): boolean {
    return this.appliedId === item.id;
  }

  async apply(item: StoreItem) {
    if (!this.isPurchased(item)) return;
    this.appliedId = item.id;
    await this.userData.applyBackground(item.id);
  }

  async clearApplied() {
    this.appliedId = null;
    await this.userData.applyBackground(null);
  }

  private triggerSpendPulse() {
    // Ativa classe CSS por um curto período
    this.spendingPulse = false;
    // Força reflow mínimo para reiniciar animação caso compras rápidas
    setTimeout(() => {
      this.spendingPulse = true;
      setTimeout(() => this.spendingPulse = false, 650); // um pouco > duração da animação
    }, 0);
  }

  private animateDisplayBalance(from: number, to: number, durationMs: number) {
    const start = performance.now();
    const diff = to - from; // negativo para diminuir
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const value = from + diff * eased;
      // Exibe valor inteiro
      this.displayBalance = Math.round(value);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.displayBalance = to;
      }
    };

    requestAnimationFrame(step);
  }

  onNext() {
    const container = this.carouselContainer?.nativeElement;
    if (!container) return;
    const amount = Math.round(container.clientWidth * 0.9);
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }

  onPrev() {
    const container = this.carouselContainer?.nativeElement;
    if (!container) return;
    const amount = Math.round(container.clientWidth * 0.9);
    container.scrollBy({ left: -amount, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    // Ensure the carousel starts at the first item (avoids any accidental offset)
    const container = this.carouselContainer?.nativeElement;
    if (container) {
      // Use timeout to run after initial rendering/layout
      setTimeout(() => container.scrollTo({ left: 0, behavior: 'auto' }), 0);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
