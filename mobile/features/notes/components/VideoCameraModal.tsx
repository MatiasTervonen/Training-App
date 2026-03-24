import { View, Modal, Platform } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { setAudioModeAsync } from "expo-audio";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import { SwitchCamera, X, Pause, Play } from "lucide-react-native";
import { MEDIA_LIMITS } from "@/constants/media-limits";
import { formatDurationNotesVoice } from "@/lib/formatDate";

type Props = {
  visible: boolean;
  onClose: () => void;
  onVideoRecorded: (uri: string, durationMs: number) => void;
};

export default function VideoCameraModal({ visible, onClose, onVideoRecorded }: Props) {
  const { t } = useTranslation(["notes", "common"]);
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);
  const cancelledRef = useRef(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const maxDurationSec = MEDIA_LIMITS.MAX_VIDEO_DURATION_SEC;

  // Request permissions when modal opens
  useEffect(() => {
    if (visible) {
      if (!cameraPermission?.granted) requestCameraPermission();
      if (!micPermission?.granted) requestMicPermission();
    }
  }, [visible, cameraPermission?.granted, micPermission?.granted, requestCameraPermission, requestMicPermission]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      cancelledRef.current = false;
      pausedElapsedRef.current = 0;
    } else {
      setIsRecording(false);
      setIsPaused(false);
      setDurationMs(0);
      setFacing("back");
      pausedElapsedRef.current = 0;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [visible]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = pausedElapsedRef.current + (Date.now() - startTimeRef.current);
      setDurationMs(elapsed);

      // Auto-stop at max duration
      if (elapsed >= maxDurationSec * 1000) {
        cameraRef.current?.stopRecording();
      }
    }, 200);
  }, [maxDurationSec]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const configureAudioForRecording = async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: "mixWithOthers",
      ...(Platform.OS === "android" && { interruptionModeAndroid: "duckOthers" }),
    });
  };

  const resetAudioMode = async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: "doNotMix",
    });
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      await configureAudioForRecording();
      setIsRecording(true);
      startTimer();

      const result = await cameraRef.current.recordAsync({
        maxDuration: maxDurationSec,
      });

      stopTimer();
      setIsRecording(false);
      await resetAudioMode();

      if (result?.uri && !cancelledRef.current) {
        const finalDuration = Date.now() - startTimeRef.current;
        onVideoRecorded(result.uri, finalDuration);
        onClose();
      }
    } catch {
      stopTimer();
      setIsRecording(false);
      await resetAudioMode();
    }
  };

  const togglePause = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.toggleRecordingAsync();
      if (isPaused) {
        // Resuming — restart the timer from where we left off
        startTimeRef.current = Date.now();
        startTimer();
        setIsPaused(false);
      } else {
        // Pausing — save elapsed time and stop the timer
        pausedElapsedRef.current += Date.now() - startTimeRef.current;
        stopTimer();
        setIsPaused(true);
      }
    } catch {
      // toggleRecordingAsync may not be supported on all devices
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    cameraRef.current?.stopRecording();
  };

  const handleCancel = async () => {
    cancelledRef.current = true;
    if (isRecording) {
      cameraRef.current?.stopRecording();
      stopTimer();
      setIsRecording(false);
      await resetAudioMode();
    }
    onClose();
  };

  const permissionsGranted = cameraPermission?.granted && micPermission?.granted;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      supportedOrientations={["portrait"]}
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-black">
        {permissionsGranted ? (
          <CameraView
            ref={cameraRef}
            mode="video"
            facing={facing}
            mute={false}
            style={{ flex: 1 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <BodyText className="text-center">
              {t("notes:notes.videos.permissionRequired")}
            </BodyText>
          </View>
        )}

        {/* Top controls */}
        <View
          className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4"
          style={{ paddingTop: insets.top + 8 }}
        >
          <AnimatedButton onPress={handleCancel} className="p-2 rounded-full bg-black/50">
            <X color="#ffffff" size={28} />
          </AnimatedButton>

          {!isRecording && permissionsGranted && (
            <AnimatedButton
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
              className="p-2 rounded-full bg-black/50"
            >
              <SwitchCamera color="#ffffff" size={28} />
            </AnimatedButton>
          )}
        </View>

        {/* Bottom controls */}
        <View
          className="absolute bottom-0 left-0 right-0 items-center"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Duration */}
          {isRecording && (
            <View className="mb-3 px-4 py-1.5 rounded-full bg-black/60">
              <AppTextNC className="font-mono font-bold text-red-400 text-lg">
                {formatDurationNotesVoice(durationMs)}
              </AppTextNC>
            </View>
          )}

          {/* Limit info */}
          {!isRecording && (
            <BodyText className="text-slate-300 text-xs mb-3">
              {t("common:common.media.videoLimitInfo", {
                duration: Math.round(maxDurationSec / 60),
                size: MEDIA_LIMITS.MAX_VIDEO_SIZE_MB,
              })}
            </BodyText>
          )}

          {/* Record / Stop / Pause buttons */}
          {permissionsGranted && (
            <View className="flex-row items-center gap-8">
              {isRecording ? (
                <>
                  <AnimatedButton
                    onPress={togglePause}
                    className="w-14 h-14 rounded-full bg-black/50 items-center justify-center"
                  >
                    {isPaused ? (
                      <Play color="#ffffff" size={24} fill="#ffffff" />
                    ) : (
                      <Pause color="#ffffff" size={24} fill="#ffffff" />
                    )}
                  </AnimatedButton>

                  <AnimatedButton
                    onPress={stopRecording}
                    className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
                  >
                    <View className="w-8 h-8 rounded-sm bg-red-500" />
                  </AnimatedButton>
                </>
              ) : (
                <AnimatedButton
                  onPress={startRecording}
                  className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
                >
                  <View className="w-16 h-16 rounded-full bg-red-500" />
                </AnimatedButton>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
