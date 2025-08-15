import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundMusicService } from '../services/background-music.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy {
  faded = false; // controls slight visibility state
  isPaused = false; // UI state for play/pause toggle

  private idleTimer?: any;
  private readonly idleMs = 8000; // 8 seconds

  constructor(private music: BackgroundMusicService) {}

  ngOnInit() {
    this.isPaused = this.music.isPaused();
    this.resetIdleTimer();
  }

  ngOnDestroy(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }

  onTogglePlay() {
    this.music.togglePlay();
    this.isPaused = this.music.isPaused();
    this.onInteract();
  }

  onNext() {
    this.music.next();
    this.isPaused = this.music.isPaused();
    this.onInteract();
  }

  // Called on any interaction with the header (mouse move, click, focus, touch)
  onInteract() {
    this.faded = false; // fully visible again
    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.faded = true; // become slightly visible after 8s
    }, this.idleMs);
  }

  // Make header reappear when mouse moves over it
  @HostListener('mousemove') onMouseMove() { this.onInteract(); }
  @HostListener('click') onClick() { this.onInteract(); }
  @HostListener('touchstart', ['$event']) onTouch() { this.onInteract(); }
  @HostListener('focusin') onFocus() { this.onInteract(); }
}
