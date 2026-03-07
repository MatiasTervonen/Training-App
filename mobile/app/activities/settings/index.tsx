import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import PageContainer from "@/components/PageContainer";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";
import { MAP_STYLES, LINE_COLORS } from "@/features/activities/lib/mapConstants";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";

// Sample route: a small loop in Helsinki for preview
const SAMPLE_ROUTE: [number, number][] = [
  [24.941, 60.17],
  [24.943, 60.172],
  [24.946, 60.173],
  [24.949, 60.172],
  [24.95, 60.17],
  [24.948, 60.168],
  [24.945, 60.167],
  [24.942, 60.168],
  [24.941, 60.17],
];

const SAMPLE_ROUTE_FEATURE = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: SAMPLE_ROUTE,
  },
  properties: {},
};

const lons = SAMPLE_ROUTE.map((c) => c[0]);
const lats = SAMPLE_ROUTE.map((c) => c[1]);
const BOUNDS = {
  ne: [Math.max(...lons), Math.max(...lats)] as [number, number],
  sw: [Math.min(...lons), Math.min(...lats)] as [number, number],
};

export default function ActivitySettingsScreen() {
  const { t } = useTranslation("activities");

  const defaultMapStyle = useActivitySettingsStore(
    (state) => state.defaultMapStyle,
  );
  const defaultLineColorIndex = useActivitySettingsStore(
    (state) => state.defaultLineColorIndex,
  );
  const setDefaultMapStyle = useActivitySettingsStore(
    (state) => state.setDefaultMapStyle,
  );
  const setDefaultLineColorIndex = useActivitySettingsStore(
    (state) => state.setDefaultLineColorIndex,
  );

  const lineColor = LINE_COLORS[defaultLineColorIndex];

  return (
      <PageContainer>
        <AppText className="text-2xl text-center mb-10">
          {t("activities.settings.title")}
        </AppText>

        {/* Live Map Preview */}
        <View className="rounded-xl overflow-hidden h-[250px]">
          <Mapbox.MapView
            style={{ flex: 1 }}
            styleURL={defaultMapStyle}
            scaleBarEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}
            pointerEvents="none"
          >
            <Mapbox.Camera
              bounds={{
                ...BOUNDS,
                paddingTop: 40,
                paddingBottom: 40,
                paddingLeft: 40,
                paddingRight: 40,
              }}
              animationMode="flyTo"
              animationDuration={0}
            />
            <Mapbox.ShapeSource
              id="preview-route"
              shape={SAMPLE_ROUTE_FEATURE as any}
            >
              <Mapbox.LineLayer
                id="preview-glow"
                style={{
                  lineColor: lineColor.glow,
                  lineCap: "round",
                  lineJoin: "round",
                  lineWidth: 10,
                  lineBlur: 4,
                }}
              />
              <Mapbox.LineLayer
                id="preview-core"
                aboveLayerID="preview-glow"
                style={{
                  lineColor: lineColor.core,
                  lineWidth: 4,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </Mapbox.ShapeSource>
          </Mapbox.MapView>
        </View>

        {/* Map Style Selector */}
        <View className="gap-2 mt-6">
          <AppText className="text-lg">
            {t("activities.settings.defaultMapStyle")}
          </AppText>
          <AppText className="text-sm text-gray-400">
            {t("activities.settings.defaultMapStyleDescription")}
          </AppText>
          <View className="flex-row gap-3 mt-2">
            {MAP_STYLES.map((style) => {
              const isSelected = defaultMapStyle === style.url;
              return (
                <AnimatedButton
                  key={style.labelKey}
                  onPress={() => setDefaultMapStyle(style.url)}
                  className={`flex-1 py-3 rounded-lg items-center border-2 ${
                    isSelected
                      ? "bg-blue-700 border-blue-500"
                      : "bg-slate-800 border-slate-600"
                  }`}
                >
                  <View className="flex-row items-center gap-1">
                    <AppText
                      className={`text-sm ${isSelected ? "text-white" : "text-gray-300"}`}
                    >
                      {t(
                        `activities.settings.mapStyles.${style.labelKey}`,
                      )}
                    </AppText>
                    {isSelected && (
                      <Check size={14} color="#ffffff" />
                    )}
                  </View>
                </AnimatedButton>
              );
            })}
          </View>
        </View>

        {/* Line Color Selector */}
        <View className="gap-2 mt-6">
          <AppText className="text-lg">
            {t("activities.settings.defaultLineColor")}
          </AppText>
          <AppText className="text-sm text-gray-400">
            {t("activities.settings.defaultLineColorDescription")}
          </AppText>
          <View className="flex-row gap-4 mt-2">
            {LINE_COLORS.map((color, index) => {
              const isSelected = defaultLineColorIndex === index;
              return (
                <AnimatedButton
                  key={color.labelKey}
                  onPress={() => setDefaultLineColorIndex(index)}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isSelected ? "border-2 border-white" : ""
                  }`}
                  style={{ backgroundColor: color.core }}
                >
                  {isSelected && <Check size={20} color="#ffffff" />}
                </AnimatedButton>
              );
            })}
          </View>
        </View>
      </PageContainer>
  );
}
