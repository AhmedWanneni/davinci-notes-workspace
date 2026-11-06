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
    timeLabel.textContent = "0:00 / 0:00";
    timeLabel.setAttribute("aria-live", "off");

    const progress = document.createElement("div");
    progress.className = "cm-file-audio-embed__progress";
    progress.setAttribute("aria-hidden", "true");
    waveform.appendChild(progress);

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = this.resolveMediaUrl(this.path);

    const updateTime = () => {
      timeLabel.textContent = `${formatAudioTime(audio.currentTime)} / ${formatAudioTime(audio.duration)}`;
    };

    const updateProgress = () => {
      const ratio = Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.max(0, Math.min(1, audio.currentTime / audio.duration))
        : 0;
      waveform.style.setProperty("--audio-progress", `${ratio * 100}%`);
      const playedCount = Math.floor(ratio * barEls.length);
      barEls.forEach((bar, index) => bar.classList.toggle("is-played", index < playedCount));
      updateTime();
    };

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

    const showPlayingState = (playing: boolean) => {
      playIcon.style.display = playing ? "none" : "block";
      pauseIcon.style.display = playing ? "block" : "none";
      playBtn.setAttribute("aria-label", playing ? "Pause audio" : "Play audio");
      container.classList.toggle("is-playing", playing);
    };

    audio.onplay = () => showPlayingState(true);
    audio.onpause = () => showPlayingState(false);

    audio.onended = () => {
      showPlayingState(false);
      audio.currentTime = 0;
      updateProgress();
    };

    audio.ontimeupdate = updateProgress;
    audio.onloadedmetadata = updateProgress;

    container.appendChild(playBtn);
    container.appendChild(waveform);
    container.appendChild(timeLabel);

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
