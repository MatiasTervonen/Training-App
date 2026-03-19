import { View, Modal } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Mic } from "lucide-react-native";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from "expo-audio";
import AppText from "@/components/AppText";
import { useState, useEffect, useRef } from "react";
import { formatDurationNotesVoice } from "@/lib/formatDate";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MEDIA_LIMITS } from "@/constants/media-limits";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string, durationMs: number) => void;
  recordLabel?: string;
};

RecordingPresets.VOICE_HIGH_QUALITY = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
};

export default function RecordingModal({
  visible,
  onClose,
  onRecordingComplete,
  recordLabel,
}: Props) {
  const { t } = useTranslation(["notes", "common"]);
  const insets = useSafeAreaInsets();
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const confirmAction = useConfirmAction();

  const audioRecorder = useAudioRecorder(RecordingPresets.VOICE_HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const autoStoppedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  onCloseRef.current = onClose;
  onRecordingCompleteRef.current = onRecordingComplete;

  const maxDurationMs = MEDIA_LIMITS.MAX_VOICE_DURATION_SEC * 1000;

  // Auto-stop when max duration is reached
  useEffect(() => {
    if (
      recorderState.isRecording &&
      recorderState.durationMillis >= maxDurationMs &&
      !autoStoppedRef.current
    ) {
      autoStoppedRef.current = true;
      audioRecorder.stop().then(() => {
        const { uri } = audioRecorder;
        if (uri == null) return;
        setIsPaused(false);
        setHasStarted(false);
        onRecordingCompleteRef.current(uri, maxDurationMs);
        onCloseRef.current();
      });
    }
  }, [
    recorderState.durationMillis,
    recorderState.isRecording,
    audioRecorder,
    maxDurationMs,
  ]);

  const record = async () => {
    autoStoppedRef.current = false;
    const status = await AudioModule.requestRecordingPermissionsAsync();

    if (!status.granted) {
      return;
    }

    if (recorderState.isRecording) {
      await audioRecorder.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      try {
        await audioRecorder.record();
      } catch {
        // Android throws IllegalStateException during pause→resume transition
        // but the recording works correctly — safe to ignore
      }
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
    setIsPaused(false);
    setHasStarted(true);
  };

  const stopRecording = async () => {
    await audioRecorder.stop();
    setIsPaused(false);
    setHasStarted(false);

    const { uri } = audioRecorder;
    if (uri == null) return;

    const durationMs = recorderState.durationMillis;
    onRecordingComplete(uri, durationMs);
    onClose();
  };

  const cancelRecording = async () => {
    if (hasStarted || recorderState.isRecording || isPaused) {
      const confirmed = await confirmAction({
        title: t("notes.voiceRecording.cancelRecordingTitle"),
        message: t("notes.voiceRecording.cancelRecordingMessage"),
        confirmText: t("notes.voiceRecording.yes"),
      });
      if (!confirmed) return;

      await audioRecorder.stop();
    }

    setIsPaused(false);
    setHasStarted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cancelRecording}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-slate-900 rounded-t-2xl px-6 pt-6 border-[1.5px] border-b-0 border-blue-500/60"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="items-center mb-5">
            <View className="flex-row items-center gap-3 mb-4">
              <Mic color="#3b82f6" size={28} />
              <AppText className="text-2xl text-blue-400" style={{ width: 72 }}>
                {formatDurationNotesVoice(recorderState.durationMillis)}
              </AppText>
            </View>
            <AppText className="text-xs text-slate-400 mb-3">
              {t("common:common.media.voiceLimitInfo", {
                duration: Math.round(MEDIA_LIMITS.MAX_VOICE_DURATION_SEC / 60),
              })}
            </AppText>

            <AnimatedButton
              label={
                !hasStarted
                  ? (recordLabel ?? t("notes.voiceRecording.recordVoiceNote"))
                  : isPaused
                    ? t("notes.voiceRecording.resumeRecording")
                    : t("notes.voiceRecording.pauseRecording")
              }
              onPress={record}
              className="btn-add w-full"
            />
          </View>

          <View className="flex-row gap-4">
            <AnimatedButton
              label={t("notes.voiceRecording.cancel")}
              onPress={cancelRecording}
              className="btn-danger flex-1"
            />
            <AnimatedButton
              label={t("notes.voiceRecording.finish")}
              onPress={stopRecording}
              className="btn-save flex-1"
              disabled={!hasStarted}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
