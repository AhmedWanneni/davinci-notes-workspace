export interface TranscriptSegment {
  id: number;
  text: string;
  startMs: number;
  endMs: number;
  speaker?: string;
}

export interface MeetingAudioResult {
  wavFilePath: string;
  durationSeconds: number;
  totalSamples: number;
  sampleRate: number;
}

export interface RecordingStatusResponse {
  status: "idle" | "recording" | "paused" | "processing";
  elapsedSeconds: number;
  sampleCount: number;
}

export interface AudioLevelPayload {
  micLevel: number;
  sysLevel: number;
  elapsedSeconds: number;
}

async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

export async function startMeetingRecording(): Promise<void> {
  await safeInvoke("start_meeting_recording");
}

export async function pauseMeetingRecording(): Promise<void> {
  await safeInvoke("pause_meeting_recording");
}

export async function resumeMeetingRecording(): Promise<void> {
  await safeInvoke("resume_meeting_recording");
}

export async function stopMeetingRecording(): Promise<MeetingAudioResult> {
  return safeInvoke<MeetingAudioResult>("stop_meeting_recording");
}

export async function getMeetingRecordingStatus(): Promise<RecordingStatusResponse> {
  return safeInvoke<RecordingStatusResponse>("get_meeting_recording_status");
}

export async function listAudioInputDevices(): Promise<string[]> {
  return safeInvoke<string[]>("list_audio_input_devices");
}

export async function transcribeAudioChunk(
  wavBytes: Uint8Array,
  apiKey: string,
  endpoint?: string,
  model?: string,
): Promise<TranscriptSegment[]> {
  return safeInvoke<TranscriptSegment[]>("transcribe_audio_chunk", {
    wavBytes: Array.from(wavBytes),
    apiKey,
    endpoint,
    model,
  });
}

export async function transcribeAudioFile(
  filePath: string,
  apiKey: string,
  endpoint?: string,
  model?: string,
): Promise<TranscriptSegment[]> {
  return safeInvoke<TranscriptSegment[]>("transcribe_audio_file", {
    filePath,
    apiKey,
    endpoint,
    model,
  });
}
