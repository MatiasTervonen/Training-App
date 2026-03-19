import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, ScrollView, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCard from "@/lib/hooks/useShareCard";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import useSwipeToDismiss from "@/lib/hooks/useSwipeToDismiss";
import { getTheme, SHARE_CARD_DIMENSIONS, ShareCardTheme, ShareCardSize, ShareCardThemeId } from "@/lib/share/themes";
import { Download, Share2 } from "lucide-react-native";
import ToastMessage from "react-native-toast-message";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { toastConfig } from "@/lib/config/toast";
import * as Haptics from "expo-haptics";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { RefObject } from "react";

export type ShareModalShellRenderCardProps = {
  cardRef: RefObject<View | null>;
  theme: ShareCardTheme;
  size: ShareCardSize;
  themeId: ShareCardThemeId;
};

type ShareModalShellProps = {
  visible: boolean;
  onClose: () => void;
  prefix: string;
  renderCard: (props: ShareModalShellRenderCardProps) => ReactNode;
  middleContent?: (props: { themeId: ShareCardThemeId; size: ShareCardSize }) => ReactNode;
  scrollable?: boolean;
  extraDisabled?: boolean;
  shareCardPickerProps?: {
    showGradient?: boolean;
    onShowGradientChange?: (value: boolean) => void;
  };
  labels: {
    save: string;
    saving: string;
    share: string;
    sharing: string;
    close: string;
    saveSuccess: string;
    saveError: string;
    shareError: string;
    error: string;
  };
  outsideContent?: ReactNode;
};

export default function ShareModalShell({
  visible,
  onClose,
  prefix,
  renderCard,
  middleContent,
  scrollable = false,
  extraDisabled = false,
  shareCardPickerProps,
  labels,
  outsideContent,
}: ShareModalShellProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard(prefix);

  const {
    theme: themeId,
    size,
    setTheme,
    setSize,
  } = useShareCardPreferences();

  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const dims = useMemo(() => SHARE_CARD_DIMENSIONS[size], [size]);
  const { panGesture, contentStyle, bgStyle, reset } = useSwipeToDismiss(onClose);

  useEffect(() => {
    if (visible) reset();
  }, [visible]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const previewAreaHeight = useMemo(
    () => containerHeight * 0.4,
    [containerHeight],
  );

  const shareCardScale = useMemo(() => {
    if (containerWidth === 0 || previewAreaHeight === 0) return 0.3;
    const scaleX = (containerWidth - 40) / dims.width;
    const scaleY = previewAreaHeight / dims.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, previewAreaHeight, dims]);

  const cardContainerStyle = useMemo(
    () => ({
      width: dims.width * shareCardScale,
      height: dims.height * shareCardScale,
      overflow: "hidden" as const,
    }),
    [dims, shareCardScale],
  );

  const transformStyle = useMemo(
    () => ({
      transform: [{ scale: shareCardScale }],
      transformOrigin: "top left" as const,
    }),
    [shareCardScale],
  );

  const disabled = isSaving || isSharing || extraDisabled;

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard(size);
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: labels.error,
        text2: labels.shareError,
      });
    }
  }, [shareCard, size, onClose, labels]);

  const handleSave = useCallback(async () => {
    const success = await saveCardToGallery(size);
    Toast.show({
      type: success ? "success" : "error",
      text1: success ? labels.saveSuccess : labels.error,
      text2: success ? undefined : labels.saveError,
      topOffset: 60,
    });
  }, [saveCardToGallery, size, labels]);

  const buttons = (
    <View className="w-full gap-3 mt-8">
      <View className="flex-row gap-3">
        <AnimatedButton
          onPress={handleSave}
          className="flex-1 btn-save flex-row items-center justify-center gap-2"
          disabled={disabled}
        >
          <Download color="#f3f4f6" size={18} />
          <AppText className="text-base text-center" numberOfLines={1}>
            {isSaving ? labels.saving : labels.save}
          </AppText>
        </AnimatedButton>
        <AnimatedButton
          onPress={handleShare}
          className="flex-1 btn-add flex-row items-center justify-center gap-2"
          disabled={disabled}
        >
          <Share2 color="#f3f4f6" size={18} />
          <AppText className="text-base text-center" numberOfLines={1}>
            {isSharing ? labels.sharing : labels.share}
          </AppText>
        </AnimatedButton>
      </View>
      <AnimatedButton
        onPress={onClose}
        className="btn-neutral items-center justify-center"
      >
        <AppText className="text-base text-center">
          {labels.close}
        </AppText>
      </AnimatedButton>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView className="flex-1">
        <Animated.View className="absolute inset-0 bg-black/95" style={bgStyle} />
        <Animated.View className="flex-1" style={contentStyle}>
          <View
            className="flex-1 px-5"
            style={{
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
            }}
            onLayout={onLayout}
          >
            {containerHeight === 0 ? null : (
              <>
                {/* Card preview — swipe here to dismiss */}
                <GestureDetector gesture={panGesture}>
                  <View
                    className="items-center justify-center"
                    style={{ height: previewAreaHeight }}
                  >
                    <View style={cardContainerStyle}>
                      <View style={transformStyle}>
                        {renderCard({ cardRef, theme, size, themeId })}
                      </View>
                    </View>
                  </View>
                </GestureDetector>

                {scrollable ? (
                  <ScrollView
                    className="flex-1 mt-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
                  >
                    <View>
                      {middleContent?.({ themeId, size })}
                      <View className="mt-4">
                        <ShareCardPicker
                          selectedSize={size}
                          onSizeChange={setSize}
                          selectedTheme={themeId}
                          onThemeChange={setTheme}
                          {...shareCardPickerProps}
                        />
                      </View>
                    </View>
                    {buttons}
                  </ScrollView>
                ) : (
                  <View className="flex-1 justify-between">
                    <View>
                      {middleContent?.({ themeId, size })}
                      <View className="mt-4">
                        <ShareCardPicker
                          selectedSize={size}
                          onSizeChange={setSize}
                          selectedTheme={themeId}
                          onThemeChange={setTheme}
                          {...shareCardPickerProps}
                        />
                      </View>
                    </View>
                    {buttons}
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>

      {outsideContent}

      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
