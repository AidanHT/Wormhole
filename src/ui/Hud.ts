/** In-game HUD: crosshair, prompts, subtitles, objective, fades, chapter cards. */
export class Hud {
  private crosshair!: HTMLElement;
  private ringAmber!: HTMLElement;
  private ringCyan!: HTMLElement;
  private prompt!: HTMLElement;
  private subtitles!: HTMLElement;
  private objective!: HTMLElement;
  private fpsEl!: HTMLElement;
  private fade!: HTMLElement;
  private chapterCard!: HTMLElement;
  private subQueue: { speaker: string; text: string; duration: number }[] = [];
  private subActive = false;
  private denyTimer = 0;

  constructor(private ui: HTMLElement, showFps: boolean) {
    ui.insertAdjacentHTML('beforeend', `
      <div id="vignette"></div>
      <div id="objective" class="hidden"><div class="chamber"></div><div class="task"></div></div>
      <div id="crosshair" class="hidden">
        <div class="ring amber"></div><div class="ring cyan"></div><div class="dot"></div>
      </div>
      <div id="prompt" class="hidden"></div>
      <div id="subtitles"></div>
      <div id="chapter-card"><div class="ch-num"></div><div class="ch-name"></div></div>
      <div id="fps" class="${showFps ? '' : 'hidden'}"></div>
      <div id="fade" class="instant"></div>
    `);
    this.crosshair = ui.querySelector('#crosshair')!;
    this.ringAmber = ui.querySelector('#crosshair .ring.amber')!;
    this.ringCyan = ui.querySelector('#crosshair .ring.cyan')!;
    this.prompt = ui.querySelector('#prompt')!;
    this.subtitles = ui.querySelector('#subtitles')!;
    this.objective = ui.querySelector('#objective')!;
    this.fpsEl = ui.querySelector('#fps')!;
    this.fade = ui.querySelector('#fade')!;
    this.chapterCard = ui.querySelector('#chapter-card')!;
  }

  setCrosshairVisible(v: boolean): void {
    this.crosshair.classList.toggle('hidden', !v);
  }

  setPortalLit(color: 'amber' | 'cyan', lit: boolean): void {
    (color === 'amber' ? this.ringAmber : this.ringCyan).classList.toggle('lit', lit);
  }

  denyFlash(): void {
    this.crosshair.classList.add('deny');
    clearTimeout(this.denyTimer);
    this.denyTimer = window.setTimeout(() => this.crosshair.classList.remove('deny'), 220);
  }

  showPrompt(html: string | null): void {
    if (html === null) {
      this.prompt.classList.add('hidden');
    } else {
      this.prompt.innerHTML = html;
      this.prompt.classList.remove('hidden');
    }
  }

  subtitle(speaker: string, text: string, duration: number): void {
    this.subQueue.push({ speaker, text, duration });
    if (!this.subActive) this.nextSubtitle();
  }

  clearSubtitles(): void {
    this.subQueue.length = 0;
    this.subtitles.innerHTML = '';
    this.subActive = false;
  }

  private nextSubtitle(): void {
    const item = this.subQueue.shift();
    if (!item) { this.subActive = false; return; }
    this.subActive = true;
    const div = document.createElement('div');
    div.className = `line ${item.speaker}`;
    div.textContent = item.text;
    this.subtitles.innerHTML = '';
    this.subtitles.appendChild(div);
    window.setTimeout(() => {
      if (this.subtitles.contains(div)) this.subtitles.removeChild(div);
      this.nextSubtitle();
    }, item.duration * 1000);
  }

  setObjective(chapter: string, title: string): void {
    if (!chapter && !title) { this.objective.classList.add('hidden'); return; }
    this.objective.classList.remove('hidden');
    this.objective.querySelector('.chamber')!.textContent = chapter;
    this.objective.querySelector('.task')!.textContent = title;
  }

  setFps(fps: number): void {
    this.fpsEl.textContent = `${fps} fps`;
    this.fpsEl.style.color = fps >= 50 ? '#4a5' : fps >= 30 ? '#a94' : '#a44';
  }

  showChapterCard(num: string, name: string): void {
    this.chapterCard.querySelector('.ch-num')!.textContent = `CHAMBER ${num}`;
    this.chapterCard.querySelector('.ch-name')!.textContent = name;
    this.chapterCard.classList.add('show');
    window.setTimeout(() => this.chapterCard.classList.remove('show'), 4200);
  }

  /** Fade to black. Resolves when fully dark. */
  fadeOut(slow = false): Promise<void> {
    this.fade.classList.remove('instant');
    this.fade.classList.toggle('slow', slow);
    this.fade.style.opacity = '1';
    return new Promise((r) => setTimeout(r, slow ? 2250 : 650));
  }

  fadeIn(slow = false): Promise<void> {
    this.fade.classList.remove('instant');
    this.fade.classList.toggle('slow', slow);
    this.fade.style.opacity = '0';
    return new Promise((r) => setTimeout(r, slow ? 2250 : 650));
  }

  snapDark(): void {
    this.fade.classList.add('instant');
    this.fade.style.opacity = '1';
  }
}
