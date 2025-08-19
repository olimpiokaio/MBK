import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { PlayComponent } from './play/play.component';
import { TrophyToastComponent } from './shared/trophy-toast/trophy-toast.component';
import { SelosService } from './services/selos.service';
import { CoinService } from './services/coin.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, HomeComponent, PlayComponent, TrophyToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'MBK';

  private sanitizer = inject(DomSanitizer);
  private selos = inject(SelosService);
  private coins = inject(CoinService);

  // Iframe element reference
  @ViewChild('bgPlayer') bgPlayer?: ElementRef<HTMLIFrameElement>;

  // Define a small playlist of hip hop tracks (YouTube video IDs).
  // Tip: If any video is blocked from embedding in your region, replace its ID here.
  private readonly hipHopPlaylist: string[] = [
    '2OdrsOqZqh8', // Summer Walker - White Tee
    'j5-yKhDd64s', // Eminem - Not Afraid
    'O-zpOMYRi0w', // Hip Hop beat - mix (used previously)
    'mEqDKq_GkJE', // Baby Bash - Baby, I'm Back ft. Akon
    'XkQ1pltpQnw', // Don Toliver - You (feat. Travis Scott)
    'wdwlRzZ7Slc', // Chris Brown - climax
    'aq-DH4iwviE',  // Matuê - 333
    '3KL9mRus19o', // Blackstreet - No Diggity
    'yu2WGTZUgBo', // Don Toliver - No Comments,
    'jMjKz922Yh0', // DDG - She Don't Play
    'cbHkzwa0QmM', // Kendrick Lamar - peekaboo
  ];

  // Background YouTube music URL (hidden iframe)
  // Autoplays muted (mute=1) so Chrome allows autoplay; we will unmute on first user gesture using the YouTube Iframe API via postMessage.
  bgMusicUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.buildBgUrl());

  private audioActivated = false;
  private listenerBound = false;

  private buildBgUrl(): string {
    // Use the first ID as the initial video and the full list as the playlist.
    const list = this.hipHopPlaylist && this.hipHopPlaylist.length > 0
      ? this.hipHopPlaylist
      : ['O-zpOMYRi0w'];
    const initialId = list[0];
    const origin = encodeURIComponent(window.location.origin);
    const playlistParam = list.join(',');

    return (
      'https://www.youtube-nocookie.com/embed/' + initialId +
      '?autoplay=1' +
      '&controls=0' +
      '&rel=0' +
      '&modestbranding=1' +
      '&playsinline=1' +
      '&mute=1' +
      '&loop=1' +
      '&shuffle=1' +
      '&playlist=' + playlistParam +
      '&enablejsapi=1' +
      '&origin=' + origin
    );
  }

  ngOnInit() {
    // Clear earned trophies (selos) on every app reload as requested
    try { this.selos.resetAll(); } catch {}
    // Clear user coins on every full page load/reload as requested
    try { this.coins.setBalance(0); } catch {}

    // Clear store purchases and applied background on every app restart
    try {
      // Remove purchased backgrounds list
      localStorage.removeItem('mbk.store.purchased.backgrounds');
      // Remove any applied background keys (may be per player)
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mbk.store.applied.background')) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  ngAfterViewInit() {
    // Try to start playback muted as soon as possible (allowed by autoplay policies)
    setTimeout(() => {
      this.postToPlayer({ event: 'command', func: 'playVideo', args: [] });
    }, 200);

    // Bind a one-time activation on first user gesture to comply with autoplay policies
    if (!this.listenerBound) {
      this.listenerBound = true;
      const activate = () => {
        this.activateAudio();
        // Remove listeners after activation
        document.removeEventListener('click', activate);
        document.removeEventListener('touchstart', activate);
        document.removeEventListener('pointerdown', activate);
        document.removeEventListener('keydown', activate);
      };
      document.addEventListener('click', activate, { passive: true, once: true });
      document.addEventListener('touchstart', activate, { passive: true, once: true });
      document.addEventListener('pointerdown', activate, { passive: true, once: true });
      document.addEventListener('keydown', activate, { once: true });
    }

    // If the tab becomes visible again, ensure playback resumes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.postToPlayer({ event: 'command', func: 'playVideo', args: [] });
      }
    });
  }

  private postToPlayer(message: any) {
    try {
      const win = this.bgPlayer?.nativeElement.contentWindow;
      if (win) {
        win.postMessage(JSON.stringify(message), '*');
      }
    } catch (e) {
      // no-op
    }
  }

  private activateAudio() {
    if (this.audioActivated) return;
    this.audioActivated = true;

    // Sequence of commands to ensure sound starts
    // 1) Unmute
    this.postToPlayer({ event: 'command', func: 'unMute', args: [] });
    // 2) Set volume to a reasonable level
    this.postToPlayer({ event: 'command', func: 'setVolume', args: [50] });
    // 3) Enable shuffle for playlist playback
    this.postToPlayer({ event: 'command', func: 'setShuffle', args: [true] });
    // 4) Play (in case it was paused)
    this.postToPlayer({ event: 'command', func: 'playVideo', args: [] });

    // Some browsers require a slight delay before unmute/play takes effect; retry a couple of times
    setTimeout(() => {
      this.postToPlayer({ event: 'command', func: 'unMute', args: [] });
      this.postToPlayer({ event: 'command', func: 'playVideo', args: [] });
    }, 300);
    setTimeout(() => {
      this.postToPlayer({ event: 'command', func: 'unMute', args: [] });
      this.postToPlayer({ event: 'command', func: 'playVideo', args: [] });
    }, 1000);
  }
}
