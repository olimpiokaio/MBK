import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { SelosService } from '../../services/selos.service';
import { Subscription, timer } from 'rxjs';

interface ToastItem {
  id: string;
  at: number;
}

interface SeloMeta { name: string; image: string }

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

  // Minimal local mapping for selo assets (mirrors LegacyComponent)
  readonly seloMeta: Record<string, SeloMeta> = {
    'selo-primeira-vitoria': { name: 'Primeira Vitória', image: 'selos/selo-primeira-vitoria.jpg' },
    'selo-mvp': { name: 'MVP', image: 'selos/selo-mvp.jpg' },
    'selo-pontuador': { name: 'O Maioral', image: 'selos/selo-pontuador.jpg' },
    'selo-imparavel': { name: 'Imparável', image: 'selos/selo-imparavel.jpg' },
    'selo-lenda': { name: 'A Lenda Está Viva', image: 'selos/selo-lenda.jpg' },
    'selo-2': { name: 'Sexta de 2', image: 'selos/selo-2.jpg' },
    'selo-3': { name: 'Sexta de 3', image: 'selos/selo-3.jpg' },
  };

  constructor(private selos: SelosService) {
    // Subscribe to earned badge events
    this.sub = this.selos.earned$.subscribe((evt) => this.enqueue(evt));
  }

  getCurrentSeloImage(): string | null {
    const id = this.current?.id;
    return id && this.seloMeta[id]?.image ? this.seloMeta[id].image : null;
  }

  getCurrentSeloName(): string | null {
    const id = this.current?.id;
    return id && this.seloMeta[id]?.name ? this.seloMeta[id].name : id || null;
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
