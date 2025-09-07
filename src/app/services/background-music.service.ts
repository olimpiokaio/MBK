import { Injectable } from '@angular/core';

// Service to control the background YouTube iframe player that lives in AppComponent
// It communicates via postMessage to the iframe with id "bgPlayer"
@Injectable({ providedIn: 'root' })
export class BackgroundMusicService {
  private paused = false;

  // volume management
  private currentVolume = 50; // default target set by AppComponent on activation
  private ducked = false;
  private prevVolumeBeforeDuck: number | null = null;
  private fadeTimer: any = null;
  private duckRefs = 0; // simple ref counter to handle nested ducking

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
    // ensure volume is at currentVolume when resuming
    this.post({ event: 'command', func: 'setVolume', args: [this.currentVolume] });
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
    // After skipping, ensure it is playing, unmuted and at the desired volume
    this.post({ event: 'command', func: 'unMute', args: [] });
    this.post({ event: 'command', func: 'setVolume', args: [this.currentVolume] });
    this.post({ event: 'command', func: 'playVideo', args: [] });
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  // ===== Volume controls =====
  setVolume(vol: number) {
    const v = Math.max(0, Math.min(100, Math.round(vol)));
    this.currentVolume = v;
    this.post({ event: 'command', func: 'setVolume', args: [v] });
  }

  getVolume(): number {
    return this.currentVolume;
  }

  private clearFade() {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  fadeTo(target: number, durationMs = 400) {
    const from = this.currentVolume;
    const to = Math.max(0, Math.min(100, Math.round(target)));
    if (durationMs <= 0) {
      this.setVolume(to);
      return;
    }
    const steps = 8;
    const stepMs = Math.max(16, Math.floor(durationMs / steps));
    let n = 0;
    this.clearFade();
    this.fadeTimer = setInterval(() => {
      n++;
      const ratio = n / steps;
      const v = Math.round(from + (to - from) * ratio);
      this.setVolume(v);
      if (n >= steps) this.clearFade();
    }, stepMs);
  }

  // Lower music during narration
  duck(to = 15, durationMs = 250) {
    this.duckRefs++;
    if (!this.ducked) {
      this.prevVolumeBeforeDuck = this.currentVolume;
      this.ducked = true;
      this.fadeTo(to, durationMs);
    }
  }

  // Restore music volume after narration
  unduck(durationMs = 350) {
    if (this.duckRefs > 0) this.duckRefs--;
    if (this.ducked && this.duckRefs === 0) {
      const back = this.prevVolumeBeforeDuck ?? 50;
      this.fadeTo(back, durationMs);
      this.ducked = false;
      this.prevVolumeBeforeDuck = null;
    }
  }
}
