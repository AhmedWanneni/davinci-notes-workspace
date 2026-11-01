import { WidgetType } from "@codemirror/view";

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WAVEFORM_BAR_HEIGHTS = [
  12, 20, 14, 24, 18, 10, 26, 22, 16, 28, 20, 14, 18, 24, 16, 22, 12, 20, 16,
  14, 18, 12, 14, 10,
];

export class EmbedAudioWidget extends WidgetType {
  constructor(
    readonly path: string,
    readonly resolveMediaUrl: (path: string) => string,
    readonly isReadOnly?: boolean,
  ) {
    super();
  }

  eq(other: EmbedAudioWidget) {
    return this.path === other.path && this.isReadOnly === other.isReadOnly;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-file-audio-embed";
    container.setAttribute("data-audio-path", this.path);
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Audio player");

    // Circular blue play button
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "cm-file-audio-embed__play-btn";
    playBtn.setAttribute("aria-label", "Play audio");
    playBtn.innerHTML = `
      <svg class="cm-play-icon" width="13" height="13" viewBox="0 0 16 16" fill="white">
        <polygon points="4,2 14,8 4,14"/>
      </svg>
      <svg class="cm-pause-icon" width="13" height="13" viewBox="0 0 16 16" fill="white" style="display:none">
        <rect x="3" y="2" width="3.5" height="12" rx="1"/>
        <rect x="9.5" y="2" width="3.5" height="12" rx="1"/>
      </svg>
    `;

    // Waveform bars container
    const waveform = document.createElement("div");
    waveform.className = "cm-file-audio-embed__waveform";
    const barEls: HTMLElement[] = [];

    WAVEFORM_BAR_HEIGHTS.forEach((h, i) => {
      const bar = document.createElement("div");
      bar.className = "cm-file-audio-embed__bar";
      bar.style.height = `${h}px`;
      if (i >= WAVEFORM_BAR_HEIGHTS.length - 3) {
        bar.style.opacity = `${0.35 + (WAVEFORM_BAR_HEIGHTS.length - i) * 0.2}`;
      }
      waveform.appendChild(bar);
      barEls.push(bar);
    });

    // Time display
    const timeLabel = document.createElement("span");
    timeLabel.className = "cm-file-audio-embed__time";
    timeLabel.textContent = "0:00";

    // Trash delete button
    const trashBtn = document.createElement("button");
    trashBtn.type = "button";
    trashBtn.className = "cm-file-audio-embed__trash-btn";
    trashBtn.setAttribute("aria-label", "Delete audio");
    trashBtn.title = "Delete audio";
    trashBtn.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="2 4 14 4"/>
        <path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4"/>
        <path d="M12.5 4v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V4"/>
        <line x1="6.5" y1="7.5" x2="6.5" y2="11.5"/>
        <line x1="9.5" y1="7.5" x2="9.5" y2="11.5"/>
      </svg>
    `;
    trashBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("davinci:delete-audio-embed", {
          detail: { path: this.path },
        }),
      );
    };

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = this.resolveMediaUrl(this.path);

    const togglePlayback = (e?: Event) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (audio.paused) {
        void audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    };

    playBtn.onclick = togglePlayback;

    waveform.onclick = (e) => {
      e.stopPropagation();
      const rect = waveform.getBoundingClientRect();
      if (rect.width > 0 && audio.duration) {
        const ratio = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        audio.currentTime = ratio * audio.duration;
      }
    };

    const playIcon = playBtn.querySelector<HTMLElement>(".cm-play-icon")!;
    const pauseIcon = playBtn.querySelector<HTMLElement>(".cm-pause-icon")!;

    audio.onplay = () => {
      playIcon.style.display = "none";
      pauseIcon.style.display = "block";
      container.classList.add("is-playing");
    };

    audio.onpause = () => {
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
      container.classList.remove("is-playing");
    };

    audio.onended = () => {
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
      container.classList.remove("is-playing");
      barEls.forEach((b) => b.classList.remove("is-played"));
      timeLabel.textContent = formatAudioTime(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        const pct = audio.currentTime / audio.duration;
        const playedCount = Math.floor(pct * barEls.length);
        barEls.forEach((b, i) => {
          if (i <= playedCount) {
            b.classList.add("is-played");
          } else {
            b.classList.remove("is-played");
          }
        });
        timeLabel.textContent = formatAudioTime(audio.currentTime);
      }
    };

    audio.onloadedmetadata = () => {
      timeLabel.textContent = formatAudioTime(audio.duration || 0);
    };

    container.appendChild(playBtn);
    container.appendChild(waveform);
    container.appendChild(timeLabel);
    container.appendChild(trashBtn);

    const rerunBtn = document.createElement("button");
    rerunBtn.type = "button";
    rerunBtn.className = "cm-file-audio-embed__rerun-btn";
    rerunBtn.textContent = "Re-run AI";
    rerunBtn.style.display = "none";
    rerunBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("davinci:re-run-audio-transcription", {
          detail: { path: this.path },
        }),
      );
    };
    container.appendChild(rerunBtn);

    container.appendChild(audio);

    return container;
  }

  ignoreEvent(): boolean {
    return true;
  }
}
