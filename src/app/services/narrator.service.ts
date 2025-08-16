import { Injectable } from '@angular/core';

/**
 * Simple narration service using the Web Speech API to announce match events in PT-BR.
 * It provides high-level helpers to announce scoring and match end.
 */
@Injectable({ providedIn: 'root' })
export class NarratorService {
  private enabled = true; // can be toggled in future if needed
  private voice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Try to load voices (may be async in some browsers)
      this.loadVoices();
      try {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      } catch {
        // ignore
      }
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  private loadVoices() {
    try {
      const list = window.speechSynthesis.getVoices();
      this.voice = this.pickPortugueseVoice(list);
      this.voicesLoaded = true;
    } catch {
      this.voice = null;
    }
  }

  private pickPortugueseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // Prefer pt-BR, fallback to any pt, then default
    const byLang = (lang: string) => voices.find(v => v.lang?.toLowerCase().startsWith(lang));
    return byLang('pt-br') || byLang('pt_') || byLang('pt') || null;
  }

  private speak(text: string, opts?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.enabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    if (this.voice) utter.voice = this.voice;
    utter.lang = this.voice?.lang || 'pt-BR';
    utter.rate = opts?.rate ?? 1.02;
    utter.pitch = opts?.pitch ?? 1.0;
    utter.volume = opts?.volume ?? 1.0;
    window.speechSynthesis.speak(utter);
  }

  announceScore(playerName: string, pointsAdded: number, scoreA: number, scoreB: number) {
    if (pointsAdded <= 0) return; // only when scoring
    const ptsTxt = pointsAdded === 1 ? '1 ponto' : `${pointsAdded} pontos`;
    const text = `${playerName} marcou ${ptsTxt}. Placar: ${scoreA} a ${scoreB}.`;
    this.speak(text);
  }

  announceEnd(winner: 'A' | 'B' | 'Empate', mvpName?: string | null) {
    let result: string;
    if (winner === 'Empate') {
      result = 'Fim de jogo: Empate!';
    } else {
      result = `Fim de jogo: Time ${winner} venceu!`;
    }
    const mvp = mvpName ? ` MVP: ${mvpName}.` : '';
    this.speak(`${result}${mvp}`);
  }
}
