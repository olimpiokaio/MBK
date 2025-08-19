import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { CoinService } from '../services/coin.service';
import { Subscription } from 'rxjs';

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

  constructor(private coins: CoinService) {
    this.balance = this.coins.getBalance();
    this.sub = this.coins.balanceObservable.subscribe(v => this.balance = v);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
