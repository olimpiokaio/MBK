import { Injectable } from '@angular/core';

/**
 * Narração de partidas usando Web Speech API (PT-BR, voz masculina se possível).
 * Agora com comentários criativos, placar detalhado e brincadeiras com quem ainda não pontuou.
 */
@Injectable({ providedIn: 'root' })
export class NarratorService {
  private enabled = true; // pode ser alternado futuramente
  private voice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;
  private unlocked = false; // desbloqueio por gesto do usuário (necessário em vários navegadores)
  private queue: Array<{ text: string; opts?: { rate?: number; pitch?: number; volume?: number } }> = [];
  private loadRetry = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Tenta carregar as vozes (alguns navegadores carregam de forma assíncrona)
      this.loadVoices();
      try {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      } catch {
        // ignore
      }
      // prepara desbloqueio baseado em gesto do usuário
      this.setupUserGestureUnlock();
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  private loadVoices() {
    try {
      const list = window.speechSynthesis.getVoices();
      this.voice = this.pickPortugueseMaleVoice(list);
      this.voicesLoaded = Array.isArray(list) && list.length > 0;
      if (this.voicesLoaded && this.unlocked) {
        this.flushQueue();
      }
    } catch {
      this.voice = null;
    }
  }

  /**
   * Heurística para escolher uma voz masculina PT-BR/PT quando disponível.
   * A API não expõe gênero, então usamos nome/idioma como pista e ajustamos o pitch.
   */
  private pickPortugueseMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const all = voices || [];
    const lc = (s: string | undefined) => (s ?? '').toLowerCase();
    const isPt = (v: SpeechSynthesisVoice) => lc(v.lang).startsWith('pt-br') || lc(v.lang).startsWith('pt_') || lc(v.lang).startsWith('pt');

    // Preferências conhecidas (alguns navegadores expõem esses nomes)
    const preferredMaleNames = [
      'google português do brasil',
      'google português',
      'pt-br male',
      'português (brasil)',
      'português do brasil',
      'brasil masculino',
      'male',
      'masculino'
    ];

    const ptVoices = all.filter(isPt);
    const byName = (arr: SpeechSynthesisVoice[], needles: string[]) => arr.find(v => needles.some(n => lc(v.name).includes(n)));

    return (
      byName(ptVoices, preferredMaleNames) ||
      ptVoices[0] ||
      null
    );
  }

  private speak(text: string, opts?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.enabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Se ainda não há vozes carregadas ou o áudio não foi desbloqueado, enfileira
    if (!this.voicesLoaded || !this.unlocked) {
      this.queue.push({ text, opts });
      this.tryLoadVoicesLater();
      return;
    }

    this.flushIfStuck();
    this.speakNow(text, opts);
  }

  private speakNow(text: string, opts?: { rate?: number; pitch?: number; volume?: number }) {
    const utter = new SpeechSynthesisUtterance(text);
    if (this.voice) utter.voice = this.voice;
    utter.lang = this.voice?.lang || 'pt-BR';
    // Taxa e pitch levemente mais graves para soar mais masculino
    utter.rate = opts?.rate ?? 1.0;
    utter.pitch = opts?.pitch ?? 0.9;
    utter.volume = opts?.volume ?? 1.0;
    window.speechSynthesis.speak(utter);
  }

  private flushIfStuck() {
    try {
      const synth = window.speechSynthesis;
      // Alguns browsers ficam "pausados" até chamar resume dentro de um gesto
      if (synth.paused) synth.resume();
      // Se está falando muito tempo/pilha suja, cancel antes de nova fala
      if (synth.speaking && synth.pending) {
        synth.cancel();
        synth.resume();
      }
    } catch {
      // ignore
    }
  }

  private flushQueue() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!this.unlocked || !this.voicesLoaded) return;
    if (this.queue.length === 0) return;

    // Garante estado coerente e esvazia fila
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }

    const items = this.queue.slice();
    this.queue = [];
    for (const it of items) {
      this.speakNow(it.text, it.opts);
    }
  }

  private setupUserGestureUnlock() {
    if (typeof document === 'undefined') return;
    const handler = () => {
      try {
        const synth = window.speechSynthesis;
        // Fala curta e silenciosa para "acordar" o mecanismo
        const unlockUtter = new SpeechSynthesisUtterance(' ');
        unlockUtter.volume = 0;
        synth.cancel();
        synth.resume();
        synth.speak(unlockUtter);
      } catch {
        // ignore
      }
      this.unlocked = true;
      // Remove listeners e tenta escoar fila
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', handler);
      this.flushQueue();
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
  }

  private tryLoadVoicesLater() {
    if (this.voicesLoaded) return;
    // Tenta algumas vezes buscar vozes com um pequeno atraso
    if (this.loadRetry > 10) return;
    this.loadRetry++;
    setTimeout(() => this.loadVoices(), 250);
  }

  /**
   * Anuncia pontuação com narrativa criativa.
   * Mantém compatibilidade com a assinatura antiga, e aceita um objeto opcional com contexto.
   */
  announceScore(
    playerName: string,
    pointsAdded: number,
    scoreA: number,
    scoreB: number,
    opts?: {
      scoringTeam?: 'A' | 'B';
      teamNames?: { A?: string; B?: string };
      // totais por jogador (já atualizados) para brincadeiras e topo de pontuação
      playerTotals?: Record<string, number>;
    }
  ) {
    if (pointsAdded <= 0) return; // só quando soma

    const teamAName = opts?.teamNames?.A?.trim() || 'Time A';
    const teamBName = opts?.teamNames?.B?.trim() || 'Time B';

    const ptsTxt = pointsAdded === 1 ? '1 ponto' : `${pointsAdded} pontos`;

    // Placar detalhado com nomes dos times
    const placar = `${teamAName}: ${scoreA} ponto${scoreA === 1 ? '' : 's'}, ${teamBName}: ${scoreB} ponto${scoreB === 1 ? '' : 's'}.`;

    // Comentário principal da cesta
    let partes: string[] = [];
    const teamPhrase = opts?.scoringTeam ? ` para ${opts.scoringTeam === 'A' ? teamAName : teamBName}` : '';
    partes.push(`${playerName} marcou ${ptsTxt}${teamPhrase}!`);

    // Se for o maior pontuador do jogo no momento
    const totals = opts?.playerTotals || undefined;
    if (totals && Object.keys(totals).length > 0) {
      const me = totals[playerName] ?? 0;
      const values = Object.values(totals);
      const max = Math.max(...values);
      // verificar se é líder isolado
      const numMax = values.filter(v => v === max).length;
      if (me === max && max > 0) {
        if (numMax === 1) {
          partes.push(`É o artilheiro do jogo até agora, e a rodinha dele tá pegando fogo, kkk!`);
        } else {
          partes.push(`Segue no topo da artilharia, dividindo a liderança. A rodinha tá quente, kkk!`);
        }
      }
    }

    // Brincadeiras aleatórias com quem não pontuou ainda
    const gag = this.buildPlayfulJoke(playerName, totals);
    if (gag) partes.push(gag);

    // Fechar com o placar
    partes.push(`Placar: ${placar}`);

    this.speak(partes.join(' '));
  }

  private buildPlayfulJoke(currentScorer: string, totals?: Record<string, number>): string | null {
    if (!totals) return null;
    const entries = Object.entries(totals);
    if (entries.length === 0) return null;

    const zeros = entries.filter(([name, val]) => val === 0 && name !== currentScorer).map(([n]) => n);
    const lowies = entries.filter(([name, val]) => val > 0 && val <= 2 && name !== currentScorer).map(([n]) => n);

    const targetList = zeros.length > 0 ? zeros : lowies;
    if (targetList.length === 0) return null;

    const pick = targetList[Math.floor(Math.random() * targetList.length)];

    const jokes = zeros.length > 0 ? [
      `${pick}, hoje veio só pra tirar foto? Bora pontuar!`,
      `${pick} tá economizando pontos pra semana que vem, será?`,
      `Alô ${pick}, a cesta te mandou um oi!`,
      `Será que o ${pick} esqueceu a rodinha em casa?`,
    ] : [
      `${pick} tá tímido, mas daqui a pouco engrena!`,
      `Olho no ${pick}, que quando faz o primeiro, deslancha!`,
      `${pick} tá naquele aquecimento maroto ainda, calma torcida!`,
    ];

    return jokes[Math.floor(Math.random() * jokes.length)] + ' ';
  }

  announceEnd(winner: 'A' | 'B' | 'Empate', mvpName?: string | null) {
    let result: string;
    if (winner === 'Empate') {
      result = 'Fim de jogo: Empate! Jogaço equilibrado!';
    } else {
      result = `Fim de jogo: ${winner === 'A' ? 'Time A' : 'Time B'} venceu!`; // explicita o nome do time
    }
    const mvp = mvpName ? ` MVP: ${mvpName}. Que partida!` : '';
    this.speak(`${result}${mvp}`);
  }
}
