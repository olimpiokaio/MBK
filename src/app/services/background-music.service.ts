import { Injectable } from '@angular/core';

// Service to control the background YouTube iframe player that lives in AppComponent
// It communicates via postMessage to the iframe with id "bgPlayer"
@Injectable({ providedIn: 'root' })
export class BackgroundMusicService {
  private paused = false;

  private get playerWindow(): Window | null {
    const iframe = document.getElementById('bgPlayer') as HTMLIFrameElement | null;
    return iframe?.contentWindow ?? null;
  }

  private post(message: any) {
    try {
      this.playerWindow?.postMessage(JSON.stringify(message), '*');
    } catch {
      // no-op
    }
  }

  play() {
    this.post({ event: 'command', func: 'playVideo', args: [] });
    this.post({ event: 'command', func: 'unMute', args: [] });
    this.paused = false;
  }

  pause() {
    this.post({ event: 'command', func: 'pauseVideo', args: [] });
    this.paused = true;
  }

  togglePlay() {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  next() {
    // For a playlist, nextVideo advances to the next track
    this.post({ event: 'command', func: 'nextVideo', args: [] });
    // After skipping, ensure it is playing and unmuted
    this.post({ event: 'command', func: 'unMute', args: [] });
    this.post({ event: 'command', func: 'playVideo', args: [] });
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }
}
