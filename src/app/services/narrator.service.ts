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
  }

  // Define estilo "Rômulo" energizado
  setRomuloStyle(enabled: boolean) {
    this.style = enabled ? 'romulo' : 'default';
    try { localStorage.setItem('narrator.style', this.style); } catch {}
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
    // Parâmetros base ajustados pelo estilo, podendo ser sobrescritos por opts
    utter.rate = opts?.rate ?? this.baseRate;
    utter.pitch = opts?.pitch ?? this.basePitch;
    utter.volume = opts?.volume ?? this.baseVolume;
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
              'Segue no topo da artilharia, dividindo a liderança. A rodinha tá quente!',
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

    // 4.6) Fechamento obrigatório com o placar por extenso
    partes.push(`Placar: ${placar}`);

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

  announceEnd(winner: 'A' | 'B' | 'Empate', mvpName?: string | null) {
    let result: string;
    if (winner === 'Empate') {
      result = this.style === 'romulo' ? 'Fim de jogo! Tudo igual! Que drama!' : 'Fim de jogo: Empate! Jogaço equilibrado!';
    } else {
      const base = `Fim de jogo: ${winner === 'A' ? 'Time A' : 'Time B'} venceu!`;
      result = this.style === 'romulo' ? `${base} Que vitória!` : base; // explicita o nome do time
    }
    const mvp = mvpName ? (this.style === 'romulo' ? ` MVP da partida: ${mvpName}!` : ` MVP: ${mvpName}. Que partida!`) : '';
    this.speak(`${result}${mvp}`);
  }
}
