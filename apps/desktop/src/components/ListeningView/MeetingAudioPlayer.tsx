import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, SpeakerHigh, SpeakerSlash, WarningCircle } from "@phosphor-icons/react";
import styles from "./ListeningView.module.scss";

export interface MeetingAudioPlayerProps {
  audioSrc: string;
  durationSeconds?: number;
  className?: string;
}

function formatDurationSec(sec: number): string {
  if (!sec || isNaN(sec) || !isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function MeetingAudioPlayer({
  audioSrc,
  durationSeconds = 0,
  className = "",
}: MeetingAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (durationSeconds > 0) setTotalDuration(durationSeconds);
  }, [durationSeconds]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setLoadError(false);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn("Failed to play audio:", err);
      setLoadError(true);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (dur && isFinite(dur) && !isNaN(dur)) {
      setTotalDuration(dur);
    }
    setLoadError(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      className={`${styles["meeting-audio-player"]} ${className}`}
      data-testid="meeting-audio-player"
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setLoadError(true)}
      />

      <div className={styles["player-left-group"]}>
        <button
          type="button"
          className={styles["player-play-btn"]}
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio recording" : "Play audio recording"}
          data-testid="audio-play-btn"
        >
          {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>

        <div className={styles["player-time-badge"]}>
          <span>{formatDurationSec(currentTime)}</span>
          <span className={styles["time-divider"]}>/</span>
          <span>{formatDurationSec(totalDuration)}</span>
        </div>
      </div>

      <div className={styles["player-waveform-scrubber"]}>
        <div className={styles["mini-waveform-bars"]} aria-hidden="true">
          {Array.from({ length: 48 }).map((_, idx) => {
            const progressRatio = totalDuration > 0 ? currentTime / totalDuration : 0;
            const barRatio = idx / 48;
            const isPlayed = barRatio <= progressRatio;
            const height = 8 + Math.abs(Math.sin(idx * 0.45)) * 18;
            return (
              <span
                key={idx}
                className={`${styles["mini-wave-bar"]} ${isPlayed ? styles["is-played"] : ""}`}
                style={{ height: `${Math.round(height)}px` }}
              />
            );
          })}
        </div>

        <div
          className={styles["scrubber-progress-line"]}
          style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
        />

        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className={styles["player-slider"]}
          aria-label="Seek audio timeline"
        />
      </div>

      <div className={styles["player-right-group"]}>
        {loadError && (
          <span className={styles["player-error-badge"]} title="Audio file failed to load">
            <WarningCircle size={14} />
          </span>
        )}

        <button
          type="button"
          className={styles["speed-btn"]}
          onClick={cyclePlaybackRate}
          title="Playback speed"
        >
          {playbackRate}x
        </button>

        <button
          type="button"
          className={styles["mute-btn"]}
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
        </button>
      </div>
    </div>
  );
}
