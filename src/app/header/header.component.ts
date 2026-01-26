import { Component, HostListener, OnDestroy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { BackgroundMusicService } from '../services/background-music.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy {
  faded = false; // controls slight visibility state
  isPaused = false; // UI state for play/pause toggle

  private idleTimer?: any;
  private readonly idleMs = 8000; // 8 seconds

  private music = inject(BackgroundMusicService);
  auth = inject(AuthService);
  private router = inject(Router);
  private profile = inject(ProfileService);

  user = this.auth.currentUser;
  displayName = computed(() => this.profile.profile().name || (this.auth.currentUser()?.username ?? ''));

  // Track if current route is home ('/')
  isHome = false;
  // Track if current route is login ('/login')
  isLogin = false;

  ngOnInit() {
    this.isPaused = this.music.isPaused();
    this.resetIdleTimer();

    // initialize flags and subscribe to changes
    const url = this.router.url || '';
    this.isHome = url === '/' || url === '';
    this.isLogin = url.startsWith('/login');
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        const u = ev.urlAfterRedirects || '';
        this.isHome = u === '/' || u === '';
        this.isLogin = u.startsWith('/login');
      }
    });
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

  onLogout() {
    // Realiza logout e redireciona para a tela de login
    this.auth.logout();
    try { this.router.navigateByUrl('/login'); } catch {}
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
