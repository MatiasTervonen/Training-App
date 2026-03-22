"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MAX_VOICE_DURATION_MS = 30 * 60 * 1000; // 30 min

type VoiceRecordingState = {
  isRecording: boolean;
  durationMs: number;
  audioFile: File | null;
  audioUrl: string | null;
};

export function useVoiceRecording() {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    durationMs: 0,
    audioFile: null,
    audioUrl: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Prefer webm, fall back to whatever is available
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorderOptions: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
      if (mimeType) recorderOptions.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const ext = (recorder.mimeType || "").includes("webm") ? "webm" : "ogg";
        const file = new File([blob], `voice.${ext}`, { type: blob.type });
        const url = URL.createObjectURL(blob);
        const finalDuration = Date.now() - startTimeRef.current;

        setState({
          isRecording: false,
          durationMs: finalDuration,
          audioFile: file,
          audioUrl: url,
        });

        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
      };

      startTimeRef.current = Date.now();
      recorder.start(250); // collect data every 250ms

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= MAX_VOICE_DURATION_MS) {
          recorder.stop();
          return;
        }
        setState((prev) => ({
          ...prev,
          durationMs: elapsed,
        }));
      }, 100);

      setState({
        isRecording: true,
        durationMs: 0,
        audioFile: null,
        audioUrl: null,
      });
    } catch {
      // Permission denied or no microphone
      setState((prev) => ({ ...prev, isRecording: false }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cleanup();
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      isRecording: false,
      durationMs: 0,
      audioFile: null,
      audioUrl: null,
    });
  }, [cleanup, state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
