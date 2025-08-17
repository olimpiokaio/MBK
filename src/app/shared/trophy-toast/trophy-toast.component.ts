import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { SelosService } from '../../services/selos.service';
import { Subscription, timer } from 'rxjs';

interface ToastItem {
  id: string;
  at: number;
}

@Component({
  selector: 'app-trophy-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trophy-toast.component.html',
  styleUrl: './trophy-toast.component.css',
})
export class TrophyToastComponent implements OnDestroy {
  private sub: Subscription;

  queue: ToastItem[] = [];
  current: ToastItem | null = null;
  visible = false;

  private showing = false;

  constructor(private selos: SelosService) {
    // Subscribe to earned badge events
    this.sub = this.selos.earned$.subscribe((evt) => this.enqueue(evt));
  }

  private enqueue(item: ToastItem) {
    this.queue.push(item);
    this.maybeShowNext();
  }

  private maybeShowNext() {
    if (this.showing || this.visible) return;
    const next = this.queue.shift();
    if (!next) return;
    this.current = next;
    this.showing = true;
    // Show animation
    this.visible = true;

    // Keep visible for ~4 seconds, then hide
    timer(4000).subscribe(() => {
      this.visible = false;
      // Wait for exit animation (~600ms) then proceed to next
      timer(650).subscribe(() => {
        this.current = null;
        this.showing = false;
        this.maybeShowNext();
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
