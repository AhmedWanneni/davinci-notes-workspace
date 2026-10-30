import { WidgetType } from "@codemirror/view";

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

    const header = document.createElement("div");
    header.className = "cm-file-audio-embed__header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "cm-file-audio-embed__title-group";

    const icon = document.createElement("span");
    icon.className = "cm-file-audio-embed__icon";
    icon.textContent = "🎙️";

    const title = document.createElement("span");
    title.className = "cm-file-audio-embed__title";
    title.textContent = this.path.split(/[/\\]/).pop() ?? this.path;

    titleGroup.appendChild(icon);
    titleGroup.appendChild(title);
    header.appendChild(titleGroup);

    const rerunBtn = document.createElement("button");
    rerunBtn.type = "button";
    rerunBtn.className = "cm-file-audio-embed__rerun-btn";
    rerunBtn.textContent = "Re-run AI";
    rerunBtn.title = "Re-run transcription and AI note listening";
    rerunBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("davinci:re-run-audio-transcription", {
          detail: { path: this.path },
        }),
      );
    };
    header.appendChild(rerunBtn);
    container.appendChild(header);

    const controls = document.createElement("div");
    controls.className = "cm-file-audio-embed__controls";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "cm-file-audio-embed__play-btn";
    playBtn.textContent = "▶ Play";
    playBtn.setAttribute("aria-label", "Play audio");

    const progressWrapper = document.createElement("div");
    progressWrapper.className = "cm-file-audio-embed__progress-wrapper";

    const progressTrack = document.createElement("div");
    progressTrack.className = "cm-file-audio-embed__progress-track";

    const progressBar = document.createElement("div");
    progressBar.className = "cm-file-audio-embed__progress-bar";
    progressTrack.appendChild(progressBar);

    const timeLabel = document.createElement("span");
    timeLabel.className = "cm-file-audio-embed__time";
    timeLabel.textContent = "0:00 / 0:00";

    progressWrapper.appendChild(progressTrack);
    progressWrapper.appendChild(timeLabel);

    controls.appendChild(playBtn);
    controls.appendChild(progressWrapper);
    container.appendChild(controls);

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "metadata";
    audio.src = this.resolveMediaUrl(this.path);
    audio.className = "cm-file-audio-embed__player";
    container.appendChild(audio);

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

    container.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".cm-file-audio-embed__rerun-btn") ||
        target.closest(".cm-file-audio-embed__progress-track")
      ) {
        return;
      }
      togglePlayback(e);
    };

    progressTrack.onclick = (e) => {
      e.stopPropagation();
      const rect = progressTrack.getBoundingClientRect();
      if (rect.width > 0 && audio.duration) {
        const ratio = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        audio.currentTime = ratio * audio.duration;
      }
    };

    audio.onplay = () => {
      playBtn.textContent = "⏸ Pause";
      playBtn.setAttribute("aria-label", "Pause audio");
      container.classList.add("is-playing");
    };

    audio.onpause = () => {
      playBtn.textContent = "▶ Play";
      playBtn.setAttribute("aria-label", "Play audio");
      container.classList.remove("is-playing");
    };

    audio.onended = () => {
      playBtn.textContent = "▶ Play";
      playBtn.setAttribute("aria-label", "Play audio");
      container.classList.remove("is-playing");
      progressBar.style.width = "0%";
      timeLabel.textContent = `0:00 / ${formatAudioTime(audio.duration)}`;
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${pct}%`;
        timeLabel.textContent = `${formatAudioTime(audio.currentTime)} / ${formatAudioTime(audio.duration)}`;
      }
    };

    audio.onloadedmetadata = () => {
      timeLabel.textContent = `0:00 / ${formatAudioTime(audio.duration)}`;
    };

    return container;
  }
}
