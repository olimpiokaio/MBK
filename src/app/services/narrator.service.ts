import { Injectable } from '@angular/core';

/**
 * Narrador (Web Speech API) robusto com chunking + fila sequencial.
 * - Compatível com Chrome, Edge e Safari (incl. iOS)
 * - Carrega vozes de forma confiável (voiceschanged + tentativas)
 * - Divide texto em sentenças e por tamanho (padrão: 240 chars; mobile: 200)
 * - Fala um chunk por vez, aguardando onend antes do próximo
 * - Evita cancelar no meio da fila; cancel() usado apenas em stop()
 * - Pequeno delay (≈8ms) em cada speak para estabilidade (iOS Safari)
 *
 * API pública:
 *  - speak(text, opts?): Promise<void>
 *      opts: { voiceName?, rate?, pitch?, volume?, maxChunkChars? }
 *  - stop(): void — interrompe imediatamente e limpa fila
 *  - isSpeaking(): boolean — indica fala em andamento/pendente
 *  - setVoiceByName(name: string): void — aplica antes da próxima fala
 *
 * Recomendações de parâmetros (podem variar por navegador/voz):
 *  - rate: 0.9–1.2 (padrão ajustado por estilo)
 *  - pitch: 0.9–1.1
 *  - volume: 0.8–1.0
 */
@Injectable({ providedIn: 'root' })
export class NarratorService {
  private enabled = (typeof localStorage !== 'undefined' ? (localStorage.getItem('narrator.enabled') !== 'false') : true); // persistido
  private voice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;
  private unlocked = false; // desbloqueio por gesto do usuário (necessário em vários navegadores)

  // Estilo de narração (aproximação): padrão ou "romulo" (energético)
  private style: 'default' | 'romulo' = (typeof localStorage !== 'undefined' && (localStorage.getItem('narrator.style') as any)) || 'romulo';

  // Nome preferido de voz (se instalado no SO/navegador); persistido em localStorage
  private preferredVoiceName: string | null = (typeof localStorage !== 'undefined' ? (localStorage.getItem('narrator.voiceName') || null) : null);

  // Pequeno registro para evitar repetição imediata de frases por categoria
  // chave -> último índice sorteado
  private lastPickIndex: Record<string, number> = {};

  // Parâmetros de voz padrão, ajustados conforme o estilo
  private get baseRate() { return this.style === 'romulo' ? 1.15 : 1.0; }
  private get basePitch() { return this.style === 'romulo' ? 1.0 : 0.9; }
  private get baseVolume() { return 1.0; }

  // Fila sequencial e controle de estado para narração robusta
  private _chain: Promise<void> = Promise.resolve();
  private _stopRequested = false;
  private _currentUtterance: SpeechSynthesisUtterance | null = null;
  private _pendingCount = 0; // chunks pendentes na fila atual
  // Token de geração para invalidar filas agendadas antes de um stop()
  private _queueToken = 0;

  // Flag de finalização da narração: após o fim da partida, nada mais é enfileirado
  private _finalized = false;

  /**
   * Sorteia um item de um array com leve proteção contra repetição imediata.
   * - key: identifica o conjunto (categoria) para lembrar o último índice utilizado.
   */
  private pickRandom<T>(arr: T[], key: string): T {
    if (!arr || arr.length === 0) throw new Error('pickRandom: array vazio');
    if (arr.length === 1) return arr[0];
    const last = this.lastPickIndex[key];
    let idx = Math.floor(Math.random() * arr.length);
    // evita repetir o mesmo índice, se possível
    if (idx === last) idx = (idx + 1) % arr.length;
    this.lastPickIndex[key] = idx;
    return arr[idx];
  }

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
    try { localStorage.setItem('narrator.enabled', String(on)); } catch {}
    if (!on) this.stop();
  }

  /** Estado atual do narrador (mutado = false) */
  public isEnabled(): boolean { return this.enabled; }

  /** Alterna estado do narrador e retorna o novo estado */
  public toggleEnabled(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  // Define estilo "Rômulo" energizado
  setRomuloStyle(enabled: boolean) {
    this.style = enabled ? 'romulo' : 'default';
    try { localStorage.setItem('narrator.style', this.style); } catch {}
  }

  /**
   * Reseta o estado de finalização para uma nova partida.
   * Também interrompe qualquer fala pendente por segurança.
   */
  public resetForNewMatch(): void {
    this._finalized = false;
    this.stop();
  }

  // Força a escolha de uma voz específica pelo nome (se disponível)
  setPreferredVoiceName(name: string | null) {
    this.preferredVoiceName = name && name.trim() ? name.trim() : null;
    try {
      if (this.preferredVoiceName) localStorage.setItem('narrator.voiceName', this.preferredVoiceName);
      else localStorage.removeItem('narrator.voiceName');
    } catch {}
    // Reaplica seleção de voz
    this.loadVoices();
  }

  // Lista nomes de vozes PT para possível seleção na UI
  getPortugueseVoicesNames(): string[] {
    try {
      const list = window.speechSynthesis.getVoices() || [];
      return list.filter(v => (v.lang || '').toLowerCase().startsWith('pt')).map(v => v.name);
    } catch {
      return [];
    }
  }

  private loadVoices() {
    try {
      const list = window.speechSynthesis.getVoices();
      this.voice = this.pickPortugueseMaleVoice(list);
      this.voicesLoaded = Array.isArray(list) && list.length > 0;
      // Quando as vozes estiverem disponíveis, próximas falas usarão a voz correta.
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

    const ptVoices = all.filter(isPt);
    const byNameIncludes = (arr: SpeechSynthesisVoice[], needles: string[]) => arr.find(v => needles.some(n => lc(v.name).includes(n)));
    const byExactName = (arr: SpeechSynthesisVoice[], name: string) => arr.find(v => lc(v.name) === lc(name));

    // 1) Se usuário definiu um nome preferido específico, tentar exato primeiro
    if (this.preferredVoiceName) {
      const exact = byExactName(ptVoices, this.preferredVoiceName);
      if (exact) return exact;
      const fuzzy = byNameIncludes(ptVoices, [this.preferredVoiceName]);
      if (fuzzy) return fuzzy;
    }

    // 2) Preferências conhecidas, priorizando vozes masculinas PT-BR em Edge/Chrome
    const preferredMaleNames = [
      // Microsoft/Edge (masculinas PT-BR)
      'microsoft daniel - portuguese (brazil)',
      'daniel - portuguese (brazil)',
      'microsoft antonio - portuguese (brazil)',
      'antonio - portuguese (brazil)',
      'microsoft thiago',
      'thiago - portuguese (brazil)',
      // Google/Chrome
      'google português do brasil',
      'google português (brasil)',
      'google português',
      'raphael', // algumas instalações
      // Genéricas
      'pt-br male',
      'brasil masculino',
      'male',
      'masculino',
      'português (brasil)',
      'português do brasil'
    ];

    return (
      byNameIncludes(ptVoices, preferredMaleNames) ||
      ptVoices[0] ||
      null
    );
  }

  /**
   * API pública robusta para falar um texto com chunking e fila sequencial.
   * - Divide o texto em pedaços curtos (sentenças e limite de caracteres)
   * - Aguarda onend de cada pedaço antes do próximo
   * - Não usa cancel() no meio da fila (apenas em stop())
   */
  public speak(
    text: string,
    opts?: { voiceName?: string; rate?: number; pitch?: number; volume?: number; maxChunkChars?: number; allowAfterFinalize?: boolean }
  ): Promise<void> {
    if (!this.enabled) return Promise.resolve();
    if (this._finalized && !opts?.allowAfterFinalize) return Promise.resolve();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve();

    // Atualiza voz preferida se enviada nesta chamada (aplica a partir da próxima utterance)
    if (opts?.voiceName) this.setVoiceByName(opts.voiceName);

    // Normaliza texto e prepara chunks
    const normalized = this.normalizeText(text || '');
    const max = this.resolveMaxChunkChars(opts?.maxChunkChars);
    const chunks = this.splitIntoChunks(normalized, max);

    // Se não há conteúdo, encerra
    if (chunks.length === 0) return Promise.resolve();

    // Captura o token atual da fila; qualquer stop() incrementará e invalidará esta execução
    const token = this._queueToken;

    // Serializa execução numa chain para garantir ordem
    const run = async () => {
      // Se a fila foi invalidada antes de iniciar, apenas saia silenciosamente
      if (token !== this._queueToken) return;
      try {
        this._stopRequested = false; // nova execução
        await this.ensureReady();
        if (token !== this._queueToken) return;
        const synth = window.speechSynthesis;
        // Se engine estiver pausado, tenta retomar
        if (synth.paused) try { synth.resume(); } catch {}

        this._pendingCount += chunks.length;
        for (const chunk of chunks) {
          if (this._stopRequested || token !== this._queueToken) break;
          await this.speakChunk(chunk, opts);
          if (token !== this._queueToken) break;
        }
      } finally {
        // limpar contadores caso fila zere
      }
    };

    // Encadeia e retorna promessa concluída quando esta fala terminar
    this._chain = this._chain
      .then(() => (token === this._queueToken ? run() : undefined))
      .catch(() => (token === this._queueToken ? run() : undefined));
    return this._chain;
  }

  /**
   * Interrompe imediatamente e limpa fila.
   */
  public stop(): void {
    // Invalida qualquer execução agendada previamente
    this._queueToken++;
    this._stopRequested = true;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        try { window.speechSynthesis.resume(); } catch {}
      }
    } catch {}
    this._currentUtterance = null;
    this._pendingCount = 0;
    // zera chain para evitar segurar promessas antigas
    this._chain = Promise.resolve();
  }

  /**
   * Informa se há fala em andamento ou pendente.
   */
  public isSpeaking(): boolean {
    try {
      const synth = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null as any;
      return !!(synth && (synth.speaking || synth.pending)) || this._pendingCount > 0 || !!this._currentUtterance;
    } catch {
      return this._pendingCount > 0 || !!this._currentUtterance;
    }
  }

  /**
   * Define a voz a partir do nome (aplica nas próximas falas, não interrompe a atual).
   */
  public setVoiceByName(name: string): void {
    this.setPreferredVoiceName(name);
  }

  // ===== Helpers de TTS robusto =====

  private resolveMaxChunkChars(custom?: number): number {
    if (typeof custom === 'number' && custom > 0) return Math.min(400, Math.max(80, custom));
    const ua = (typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '').toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    return (isIOS || isAndroid) ? 200 : 240;
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s*([.!?…:,;])\s*/g, '$1 ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private splitIntoChunks(text: string, max: number): string[] {
    if (!text) return [];
    const sentences = this.splitBySentence(text);
    const out: string[] = [];
    for (const s of sentences) {
      if (s.length <= max) { out.push(s); continue; }
      // tenta quebrar por vírgulas/pausas
      const pieces = this.splitByLength(s, max);
      out.push(...pieces);
    }
    return out;
  }

  private splitBySentence(text: string): string[] {
    // separa por . ! ? … mantendo o delimitador
    const re = /[^.!?…]+[.!?…]?/g;
    const parts = text.match(re) || [text];
    return parts.map(p => p.trim()).filter(Boolean);
  }

  private splitByLength(sentence: string, max: number): string[] {
    const tokens = sentence.split(/(,|;|:|\s)/g).filter(t => t !== undefined);
    const chunks: string[] = [];
    let cur = '';
    for (const t of tokens) {
      const next = cur + t;
      if (next.trim().length > max && cur.trim().length > 0) {
        chunks.push(cur.trim());
        cur = t.trimStart();
      } else {
        cur = next;
      }
    }
    if (cur.trim().length) chunks.push(cur.trim());
    // se ainda restaram muito grandes por falta de separadores, quebra forçada
    const forced: string[] = [];
    for (const c of chunks) {
      if (c.length <= max) { forced.push(c); continue; }
      for (let i = 0; i < c.length; i += max) forced.push(c.slice(i, i + max));
    }
    return forced;
  }

  private async ensureReady(): Promise<void> {
    await this.waitForVoices();
    // iOS costuma exigir gesto antes de falar
    if (!this.unlocked) {
      // não bloqueia indefinidamente: tentamos falar mesmo sem unlocked em desktops
      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '').toLowerCase();
      const isiOS = /iphone|ipad|ipod/.test(ua);
      if (isiOS) {
        // aguarda um pequeno tempo por um possível gesto
        await new Promise(res => setTimeout(res, 300));
      }
    }
  }

  private waitForVoices(): Promise<void> {
    if (this.voicesLoaded && (window.speechSynthesis.getVoices() || []).length > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      const tryNow = () => {
        this.loadVoices();
        const ok = this.voicesLoaded && (window.speechSynthesis.getVoices() || []).length > 0;
        if (ok) finish();
      };
      const onVoices = () => { tryNow(); };
      try {
        window.speechSynthesis.addEventListener?.('voiceschanged', onVoices, { once: true } as any);
      } catch {}
      // tentativas com timeout progressivo
      let attempts = 0;
      const iv = setInterval(() => {
        attempts++;
        tryNow();
        if (done || attempts > 10) {
          clearInterval(iv);
          finish();
        }
      }, 150);
      // tentativa imediata
      tryNow();
    });
  }

  private speakChunk(chunk: string, opts?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this._stopRequested) { this._pendingCount = 0; return resolve(); }
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(chunk);
      this._currentUtterance = utter;
      if (this.voice) utter.voice = this.voice;
      utter.lang = this.voice?.lang || 'pt-BR';
      utter.rate = opts?.rate ?? this.baseRate;
      utter.pitch = opts?.pitch ?? this.basePitch;
      utter.volume = opts?.volume ?? this.baseVolume;

      const cleanup = () => { this._currentUtterance = null; this._pendingCount = Math.max(0, this._pendingCount - 1); };
      utter.onend = () => { cleanup(); resolve(); };
      utter.onerror = () => {
        cleanup();
        // tenta se recuperar: resume e segue para o próximo chunk
        try { if (synth.paused) synth.resume(); } catch {}
        resolve();
      };

      // Pequeno delay ajuda Safari/iOS
      setTimeout(() => {
        try {
          if (synth.paused) synth.resume();
          synth.speak(utter);
        } catch {
          resolve();
        }
      }, 8);
    });
  }

  private setupUserGestureUnlock() {
    if (typeof document === 'undefined') return;
    const handler = () => {
      try {
        const synth = window.speechSynthesis;
        // Fala curta e silenciosa para "acordar" o mecanismo
        const unlockUtter = new SpeechSynthesisUtterance(' ');
        unlockUtter.volume = 0;
        try { synth.resume(); } catch {}
        try { synth.speak(unlockUtter); } catch {}
      } catch {}
      this.unlocked = true;
      // Remove listeners
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
  }

  /**
   * Anuncia pontuação com narrativa criativa e fluxo organizado:
   * 1) Interjeição (opcional, no estilo "Rômulo")
   * 2) Ação do jogador com variações de frase
   * 3) Contexto: artilharia (sextinha) e contexto de placar (empate/liderança/vantagem)
   * 4) Brincadeira leve com quem ainda não pontuou (se couber)
   * 5) Fechamento com placar detalhado
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
      // se verdadeiro, inclui o placar no final da fala (por padrão, não inclui para reduzir tamanho da locução)
      includeScoreAtEnd?: boolean;
    }
  ) {
    // 0) Validação simples – só narra quando há pontos adicionados positivos
    if (!(Number.isFinite(pointsAdded) && pointsAdded > 0)) return;

    // 1) Nomes dos times, com fallback seguro
    const teamAName = opts?.teamNames?.A?.trim() || 'Time A';
    const teamBName = opts?.teamNames?.B?.trim() || 'Time B';

    // 2) Texto do número de pontos, cuidando de singular/plural
    const ptsTxt = pointsAdded === 1 ? '1 ponto' : `${pointsAdded} pontos`;

    // 3) Monta o placar detalhado (sempre no final)
    const placar = `${teamAName}: ${scoreA} ponto${scoreA === 1 ? '' : 's'}, ${teamBName}: ${scoreB} ponto${scoreB === 1 ? '' : 's'}.`;

    // 4) Constrói a narrativa em partes, para juntar no final
    const partes: string[] = [];

    // 4.1) Interjeição energizada (somente no estilo "Rômulo")
    if (this.style === 'romulo') {
      const hypeCommon = [
        'Que isso, meu povo!',
        'Sensacional!',
        'Gostoso de maaaaaais!',
        'Absurdo!',
        'Insano!',
        'Coisa linda!',
        'Espetacular!',
        'É disso que o povo gosta!'
      ];
      const hype3 = [
        'De longe! Para três!',
        'Bolaça de três!',
        'Choveu de fora!',
        'Da linha da esperança: TRÊS!',
      ];
      const hype2 = [
        'Na moral!',
        'Que bala!',
        'No capricho, pra dois!',
      ];
      const hype1 = [
        'Lá dentro!',
        'Converteu!',
        'Caiu macia!'
      ];
      const common = this.pickRandom(hypeCommon, 'hype.common');
      const specific = pointsAdded === 3
        ? this.pickRandom(hype3, 'hype.3')
        : pointsAdded === 2
          ? this.pickRandom(hype2, 'hype.2')
          : this.pickRandom(hype1, 'hype.1');
      partes.push(`${common} ${specific}`);
    }

    // 4.2) Descrição da ação do jogador (variações para evitar repetição)
    const teamPhrase = opts?.scoringTeam ? ` para ${opts.scoringTeam === 'A' ? teamAName : teamBName}` : '';
    const actionTemplates = [
      `${playerName} marcou ${ptsTxt}${teamPhrase}!`,
      `${playerName} converteu ${ptsTxt}${teamPhrase}!`,
      `${playerName} castiga com ${ptsTxt}${teamPhrase}!`,
      `${playerName} coloca mais ${ptsTxt}${teamPhrase}!`,
      `${playerName} não perdoa: ${ptsTxt}${teamPhrase}!`,
    ];
    partes.push(this.pickRandom(actionTemplates, 'action.templates'));

    // 4.3) Contexto de artilharia (sextinha) – se houver dados de totais por jogador
    const totals = opts?.playerTotals || undefined;
    if (totals && Object.keys(totals).length > 0) {
      const me = totals[playerName] ?? 0;
      const values = Object.values(totals);
      const max = Math.max(...values);
      const numMax = values.filter(v => v === max).length; // verifica liderança isolada
      if (me === max && max > 0) {
        const leaderLines = numMax === 1
          ? [
              'É o sextinha do jogo até agora, e a rodinha dele tá pegando fogo!',
              'Líder isolado na pontuação até aqui! Tá impossível!',
              'É o cara do jogo por enquanto! Que momento!',
            ]
          : [
              'Segue no topo da artilharia, dividindo a liderança.',
              'Empatado na artilharia do jogo! Briga boa!',
              'Divide a ponta entre os cestinhas!'
            ];
        partes.push(this.pickRandom(leaderLines, 'context.leader'));
      }
    }

    // 4.4) Contexto do placar atual – não temos o placar anterior, então focamos no diferencial presente
    const a = Number.isFinite(scoreA) ? scoreA : 0;
    const b = Number.isFinite(scoreB) ? scoreB : 0;
    const diff = Math.abs(a - b);
    const leadingTeam = a === b ? null : (a > b ? 'A' : 'B');
    if (diff === 0) {
      const tieLines = [
        'Tudo igual no marcador!',
        'Placar empatado! Jogo nervoso!',
        'Ninguém abre, segue tudo igual!'
      ];
      partes.push(this.pickRandom(tieLines, 'context.tie'));
    } else {
      const leaderName = leadingTeam === 'A' ? teamAName : teamBName;
      if (diff <= 2) {
        const closeGame = [
          `Jogo pegado! ${leaderName} tá na frente por ${diff}.`,
          `Partida apertada! ${leaderName} lidera por ${diff}.`,
          `Equilíbrio total! ${leaderName} tem vantagem mínima de ${diff}.`,
        ];
        partes.push(this.pickRandom(closeGame, 'context.close'));
      } else if (diff <= 6) {
        const midGame = [
          `${leaderName} abre ${diff} de frente.`,
          `${leaderName} vai se segurando com ${diff} de vantagem.`,
          `${leaderName} administra ${diff} no marcador.`,
        ];
        partes.push(this.pickRandom(midGame, 'context.mid'));
      } else {
        const bigLead = [
          `${leaderName} dispara e abre ${diff}!`,
          `${leaderName} constrói boa vantagem: ${diff} pontos.`,
          `${leaderName} tá confortável por ${diff}.`,
        ];
        partes.push(this.pickRandom(bigLead, 'context.big'));
      }
    }

    // 4.5) Brincadeiras aleatórias com quem não pontuou/está baixo
    const gag = this.buildPlayfulJoke(playerName, totals);
    if (gag) partes.push(gag);

    // 4.6) Fechamento com o placar por extenso (opcional para evitar locuções muito longas)
    if (opts?.includeScoreAtEnd) {
      partes.push(`Placar: ${placar}`);
    }

    // 5) Fala final – junta as partes respeitando a ordem de narrativa
    this.speak(partes.join(' '));
  }

  /**
   * Gera uma brincadeira leve e bem-humorada com quem ainda não pontuou
   * ou está com pontuação muito baixa. Sempre evita brincar com o jogador
   * que acabou de pontuar (currentScorer).
   */
  private buildPlayfulJoke(currentScorer: string, totals?: Record<string, number>): string | null {
    // 1) Sem dados de totais? Sem brincadeira.
    if (!totals) return null;
    const entries = Object.entries(totals);
    if (entries.length === 0) return null;

    // 2) Separa listas: quem está zerado (excluindo o atual) e quem tem pontuação baixa (1–2)
    const zeros = entries.filter(([name, val]) => val === 0 && name !== currentScorer).map(([n]) => n);
    const lowies = entries.filter(([name, val]) => val > 0 && val <= 2 && name !== currentScorer).map(([n]) => n);

    // 3) Alvo preferencial: quem está zerado; senão, alguém com baixa pontuação
    const targetList = zeros.length > 0 ? zeros : lowies;
    if (targetList.length === 0) return null;

    // 4) Escolhe um nome alvo – aqui não é grave repetir, então sorte simples
    const pick = targetList[Math.floor(Math.random() * targetList.length)];

    // 5) Banco de frases – um conjunto para zerados, outro para baixa pontuação
    const jokes = zeros.length > 0 ? [
      `${pick}, hoje veio só pra tirar foto? Bora pontuar!`,
      `${pick} tá economizando pontos pra semana que vem, será?`,
      `Alô ${pick}, a cesta te mandou um oi!`,
      `Será que o ${pick} esqueceu a bola em casa?`,
      `${pick} Hoje você veio mais pra distribuir sorriso do que pontos?`,
      `${pick} Sua mira tá de folga, mas o esforço tá CLT!`,
      `${pick} Tá colecionando quase-cestas, edição limitada!`,
      `${pick} Tá fazendo estágio de defensor: só marcando presença!`,
      `${pick} Tá economizando arremesso pra Black Friday, né?`,
      `Calma, o micro-ondas tá esquentando… já já sai a primeira sexta do ${pick}!`,
      `O marcador tá zerado, mas a carisma de ${pick} tá estourado!`,
      `${pick} hoje tá no modo fantasma no ataque, só aparece na foto do time!`,
    ] : [
      `${pick} tá tímido, mas daqui a pouco engrena!`,
      `Olho no ${pick}, que quando faz o primeiro, deslancha!`,
      `${pick} tá naquele aquecimento maroto ainda, calma torcida!`,
      `${pick} tá só regulando a mira… a qualquer momento liga o turbo!`,
    ];

    // 6) Retorna uma das frases com um espaço final para respirar na fala
    return jokes[Math.floor(Math.random() * jokes.length)] + ' ';
  }

  /**
   * Fala o placar atual sob demanda (para botão específico na UI).
   */
  speakScore(scoreA: number, scoreB: number, teamNames?: { A?: string; B?: string }) {
    const teamAName = teamNames?.A?.trim() || 'Time A';
    const teamBName = teamNames?.B?.trim() || 'Time B';
    const text = `Placar da partida. ${teamAName}: ${scoreA} ponto${scoreA === 1 ? '' : 's'}, ${teamBName}: ${scoreB} ponto${scoreB === 1 ? '' : 's'}.`;
    this.speak(text);
  }

  announceEnd(winner: 'A' | 'B' | 'Empate', mvpName?: string | null) {
    // 1) Limpa imediatamente qualquer fala pendente/na fila
    this.stop();

    // 2) Monta resultado objetivo (quem venceu ou empate)
    let result: string;
    if (winner === 'Empate') {
      result = this.style === 'romulo' ? 'Fim de jogo! Tudo igual! Que drama!' : 'Fim de jogo: Empate! Jogaço equilibrado!';
    } else {
      const base = `Fim de jogo: ${winner === 'A' ? 'Time A' : 'Time B'} venceu!`;
      result = this.style === 'romulo' ? `${base} Que vitória!` : base; // explicita o nome do time
    }

    // 3) MVP da Partida (se houver)
    const mvp = mvpName ? (this.style === 'romulo' ? ` MVP da partida: ${mvpName}!` : ` MVP: ${mvpName}. Que partida!`) : '';

    // 4) Despedida
    const bye = this.style === 'romulo'
      ? ' Valeu demais! Até a próxima!'
      : ' Obrigado por acompanhar. Até a próxima!';

    // 5) Seta flag de finalização para bloquear futuras falas e fala a mensagem final
    this._finalized = true;
    this.speak(`${result}${mvp}${bye}`, { allowAfterFinalize: true });
  }
}
