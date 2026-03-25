import { useState, useRef, useCallback, useEffect } from "react";
import { View, Modal, ActivityIndicator } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  type BarcodeSettings,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

const BARCODE_SCANNER_SETTINGS: BarcodeSettings = {
  barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
};

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
};

export default function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
}: BarcodeScannerModalProps) {
  const { t } = useTranslation("nutrition");
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Reset scanned state when modal opens
  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      setReady(false);
    }
  }, [visible]);

  // Request permission when modal opens
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scannedRef.current) return;
      scannedRef.current = true;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      onClose();
      onScanned(result.data);
    },
    [onClose, onScanned],
  );

  if (!visible) return null;

  const permissionGranted = permission?.granted;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {permissionGranted ? (
          <CameraView
            className="flex-1"
            facing="back"
            barcodeScannerSettings={BARCODE_SCANNER_SETTINGS}
            onBarcodeScanned={handleBarCodeScanned}
            onCameraReady={() => setReady(true)}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            {permission && !permission.granted && !permission.canAskAgain ? (
              <BodyText className="text-center px-8">
                {t("toast.cameraPermission")}
              </BodyText>
            ) : (
              <ActivityIndicator size="large" color="#f97316" />
            )}
          </View>
        )}

        {/* Overlay positioned absolutely on top of camera */}
        <View className="absolute inset-0" pointerEvents="box-none">
          {/* Close button */}
          <View className="absolute top-14 right-4 z-10">
            <AnimatedButton
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <X size={24} color="#ffffff" />
            </AnimatedButton>
          </View>

          {/* Targeting overlay — only show when camera is active */}
          {permissionGranted && (
            <View className="flex-1 items-center justify-center" pointerEvents="none">
              <View className="w-72 h-48 rounded-2xl border-2 border-white/70">
                <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
                <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
                <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
                <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />
              </View>

              <View className="mt-6">
                {ready ? (
                  <AppText className="text-base text-center">
                    {t("log.pointCamera")}
                  </AppText>
                ) : (
                  <BodyText className="text-sm text-center">
                    {t("log.searching")}
                  </BodyText>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
