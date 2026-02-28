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
import { useState } from "react";
import { formatDurationNotesVoice } from "@/lib/formatDate";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string, durationMs: number) => void;
};

RecordingPresets.VOICE_HIGH_QUALITY = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
};

export default function RecordingModal({
  visible,
  onClose,
  onRecordingComplete,
}: Props) {
  const { t } = useTranslation("notes");
  const insets = useSafeAreaInsets();
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const confirmAction = useConfirmAction();

  const audioRecorder = useAudioRecorder(RecordingPresets.VOICE_HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const record = async () => {
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
          className="bg-slate-900 rounded-t-2xl px-6 pt-6 border-2 border-b-0 border-blue-500"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="items-center mb-5">
            <View className="flex-row items-center gap-3 mb-4">
              <Mic color="#3b82f6" size={28} />
              <AppText
                className="text-2xl text-blue-400"
                style={{ width: 72 }}
              >
                {formatDurationNotesVoice(recorderState.durationMillis)}
              </AppText>
            </View>

            <AnimatedButton
              label={
                !hasStarted
                  ? t("notes.voiceRecording.recordVoiceNote")
                  : isPaused
                    ? t("notes.voiceRecording.resumeRecording")
                    : t("notes.voiceRecording.pauseRecording")
              }
              onPress={record}
              className="bg-blue-800 border-blue-500 border-2 py-3 px-6 rounded-md items-center justify-center w-full"
            />
          </View>

          <View className="flex-row gap-4">
            <AnimatedButton
              label={t("notes.voiceRecording.cancel")}
              onPress={cancelRecording}
              className="bg-red-800 py-3 rounded-md border-2 border-red-500 justify-center items-center"
              tabClassName="flex-1"
            />
            <AnimatedButton
              label={t("notes.voiceRecording.finish")}
              onPress={stopRecording}
              className="bg-blue-800 border-blue-500 border-2 py-3 rounded-md justify-center items-center"
              tabClassName="flex-1"
              disabled={!hasStarted}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
