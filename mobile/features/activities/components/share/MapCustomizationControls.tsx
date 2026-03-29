import { View } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { MAP_STYLES, LINE_COLORS } from "@/features/activities/lib/mapConstants";
import { useTranslation } from "react-i18next";

type MapCustomizationControlsProps = {
  mapStyleIndex: number;
  onMapStyleChange: (index: number) => void;
  lineColorIndex: number;
  onLineColorChange: (index: number) => void;
  hideMapDetails: boolean;
  onHideMapDetailsChange: () => void;
};

export default function MapCustomizationControls({
  mapStyleIndex,
  onMapStyleChange,
  lineColorIndex,
  onLineColorChange,
  hideMapDetails,
  onHideMapDetailsChange,
}: MapCustomizationControlsProps) {
  const { t } = useTranslation("activities");

  return (
    <View className="w-full gap-3">
      {/* Map style picker */}
      <View className="gap-1">
        <AppText className="text-sm text-gray-400">
          {t("activities.share.mapStyle")}
        </AppText>
        <View className="flex-row gap-2">
          {MAP_STYLES.map((style, i) => (
            <AnimatedButton
              key={style.labelKey}
              onPress={() => onMapStyleChange(i)}
              className={`px-4 py-2 rounded-full border ${
                mapStyleIndex === i
                  ? "bg-blue-700 border-blue-500"
                  : "bg-transparent border-gray-600"
              }`}
            >
              <AppTextNC
                className={`text-sm ${mapStyleIndex === i ? "text-gray-100" : "text-gray-400"}`}
              >
                {t(`activities.settings.mapStyles.${style.labelKey}`)}
              </AppTextNC>
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Route color picker */}
      <View className="gap-1">
        <AppText className="text-sm text-gray-400">
          {t("activities.share.routeColor")}
        </AppText>
        <View className="flex-row gap-3">
          {LINE_COLORS.map((color, i) => (
            <AnimatedButton
              key={color.labelKey}
              onPress={() => onLineColorChange(i)}
              className="items-center gap-1"
            >
              <View
                className={`w-[32px] h-[32px] rounded-full ${
                  lineColorIndex === i
                    ? "border-[1.5px] border-white"
                    : "border border-gray-600"
                }`}
                style={{ backgroundColor: color.core }}
              />
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Toggle button */}
      <AnimatedButton
        onPress={onHideMapDetailsChange}
        className={`px-4 py-2 rounded-full border self-start ${
          hideMapDetails
            ? "bg-blue-700 border-blue-500"
            : "bg-transparent border-gray-600"
        }`}
      >
        <AppTextNC
          className={`text-sm ${hideMapDetails ? "text-gray-100" : "text-gray-400"}`}
        >
          {t("activities.share.hideMapDetails")}
        </AppTextNC>
      </AnimatedButton>
    </View>
  );
}
