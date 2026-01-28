import { View, Alert, Linking } from "react-native";
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
import { confirmAction } from "@/lib/confirmAction";

type RecordVoiceNotesProps = {
  onRecordingComplete: (uri: string, durationMs?: number) => void;
};

export default function RecordVoiceNotes({
  onRecordingComplete,
}: RecordVoiceNotesProps) {
  const [isPaused, setIsPaused] = useState(false);

  RecordingPresets.VOICE_HIGH_QUALITY = {
    ...RecordingPresets.HIGH_QUALITY,
    numberOfChannels: 1, // Only change this
  };

  const audioRecorder = useAudioRecorder(RecordingPresets.VOICE_HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const record = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();

    if (!status.granted) {
      Alert.alert(
        "Microphone access needed",
        "Enable microphone access to record voice notes.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    if (recorderState.isRecording) {
      await audioRecorder.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      audioRecorder.record();
      setIsPaused(false);
      return;
    }

    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
    setIsPaused(false);
  };

  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
    setIsPaused(false);

    const { uri } = audioRecorder;
    if (uri == null) return;

    const durationMs = recorderState.durationMillis;

    onRecordingComplete(uri, durationMs);
  };
  const cancelRecording = async () => {
    const confirmed = await confirmAction({
      title: "Cancel Recording",
      message: "Are you sure you want to cancel this recording?",
      confirmText: "Yes",
    });
    if (!confirmed) return;

    await audioRecorder.stop();
    setIsPaused(false);
  };

  return (
    <View>
      <AnimatedButton
        label={
          recorderState.isRecording
            ? "Pause Recording"
            : isPaused
              ? "Resume Recording"
              : "Record Voice Note"
        }
        onPress={record}
        className="bg-blue-800 border-blue-500 border-2 py-2 justify-center items-center flex-row gap-2 rounded-md"
      >
        <Mic color="white" size={24} />
        {(recorderState.isRecording || isPaused) && (
          <AppText className="text-yellow-500 w-10">
            {formatDurationNotesVoice(recorderState.durationMillis)}
          </AppText>
        )}
      </AnimatedButton>
      {(recorderState.isRecording || isPaused) && (
        <View className="flex-row gap-4 mt-5">
          <AnimatedButton
            label="Cancel"
            onPress={cancelRecording}
            className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 justify-center items-center"
            tabClassName="flex-1"
          />
          <AnimatedButton
            label="Finish"
            onPress={stopRecording}
            className="bg-blue-800 border-blue-500 border-2 py-2 shadow-md justify-center items-center flex-row gap-2 rounded-md"
            tabClassName="flex-1"
          />
        </View>
      )}
    </View>
  );
}
