import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import {
  ShareCardSize,
  ShareCardThemeId,
  SHARE_THEMES,
} from "@/lib/share/themes";
import { useTranslation } from "react-i18next";
import AppTextNC from "@/components/AppTextNC";

type ShareCardPickerProps = {
  selectedSize: ShareCardSize;
  onSizeChange: (size: ShareCardSize) => void;
  selectedTheme: ShareCardThemeId;
  onThemeChange: (theme: ShareCardThemeId) => void;
  showGradient?: boolean;
  onShowGradientChange?: (value: boolean) => void;
};

const SIZES: { key: ShareCardSize; labelKey: string; aspectW: number; aspectH: number }[] = [
  { key: "square", labelKey: "sizeSquare", aspectW: 1, aspectH: 1 },
  { key: "story", labelKey: "sizeStory", aspectW: 9, aspectH: 16 },
  { key: "wide", labelKey: "sizeWide", aspectW: 16, aspectH: 9 },
];

const THEME_PREVIEW_COLORS: Record<ShareCardThemeId, string> = {
  classic: "#1e3a8a",
  midnight: "#000000",
  clean: "#ffffff",
  forest: "#064e3b",
};

export default function ShareCardPicker({
  selectedSize,
  onSizeChange,
  selectedTheme,
  onThemeChange,
  showGradient,
  onShowGradientChange,
}: ShareCardPickerProps) {
  const { t } = useTranslation("common");

  return (
    <View className="w-full gap-4">
      {/* Size picker */}
      <View className="gap-2">
        <AppText className="text-sm text-gray-400">
          {t("share.sizeLabel")}
        </AppText>
        <View className="flex-row gap-3">
          {SIZES.map((s) => {
            const isSelected = selectedSize === s.key;
            const boxH = 28;
            const boxW = Math.round(boxH * (s.aspectW / s.aspectH));
            return (
              <AnimatedButton
                key={s.key}
                onPress={() => onSizeChange(s.key)}
                className={`flex-row items-center gap-2 px-3 py-2 rounded-lg border ${
                  isSelected
                    ? "bg-blue-700 border-blue-500"
                    : "bg-transparent border-gray-600"
                }`}
              >
                <View
                  className={`rounded-sm border ${isSelected ? "border-white" : "border-gray-400"}`}
                  style={{ width: boxW, height: boxH }}
                />
                <AppTextNC
                  className={`text-sm ${isSelected ? "text-gray-100" : "text-gray-400"}`}
                >
                  {t(`share.${s.labelKey}`)}
                </AppTextNC>
              </AnimatedButton>
            );
          })}
        </View>
      </View>

      {/* Theme picker */}
      <View className="gap-2">
        <AppTextNC className="text-sm text-gray-400">
          {t("share.themeLabel")}
        </AppTextNC>
        <View className="flex-row flex-wrap gap-2">
          {SHARE_THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            const previewColor = THEME_PREVIEW_COLORS[theme.id];
            const labelKey = `theme${theme.id.charAt(0).toUpperCase()}${theme.id.slice(1)}` as
              | "themeClassic"
              | "themeMidnight"
              | "themeClean"
              | "themeForest";
            return (
              <AnimatedButton
                key={theme.id}
                onPress={() => onThemeChange(theme.id)}
                className={`flex-row items-center gap-2 px-3 py-2 rounded-lg border ${
                  isSelected
                    ? "bg-blue-700 border-blue-500"
                    : "bg-transparent border-gray-600"
                }`}
              >
                <View
                  className={`w-[20px] h-[20px] rounded-full ${
                    isSelected ? "border border-white" : "border border-gray-400"
                  }`}
                  style={{ backgroundColor: previewColor }}
                />
                <AppTextNC  
                  className={`text-sm ${isSelected ? "text-gray-100" : "text-gray-400"}`}
                >
                  {t(`share.${labelKey}`)}
                </AppTextNC>
              </AnimatedButton>
            );
          })}
          {onShowGradientChange != null && (
            <AnimatedButton
              onPress={() => onShowGradientChange(!showGradient)}
              className={`flex-row items-center gap-2 px-3 py-2 rounded-lg border ${
                !showGradient
                  ? "bg-blue-700 border-blue-500"
                  : "bg-transparent border-gray-600"
              }`}
            >
              <AppTextNC
                className={`text-sm ${!showGradient ? "text-gray-100" : "text-gray-400"}`}
              >
                {t("share.hideShadow")}
              </AppTextNC>
            </AnimatedButton>
          )}
        </View>
      </View>
    </View>
  );
}
