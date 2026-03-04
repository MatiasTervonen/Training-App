import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigation } from "expo-router";
import { View, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import LinkButton from "@/components/buttons/LinkButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import ActivityShareCard from "@/features/activities/components/share/ActivityShareCard";
import StatToggleChips from "@/features/activities/components/share/StatToggleChips";
import useMapSnapshot from "@/features/activities/components/share/useMapSnapshot";
import useShareCard from "@/lib/hooks/useShareCard";
import { useActivitySessionSummaryStore } from "@/lib/stores/activitySessionSummaryStore";
import {
  getAvailableStats,
  getDefaultSelectedKeys,
} from "@/features/activities/lib/activityShareCardUtils";
import { Download, Share2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import Mapbox from "@rnmapbox/maps";

const OFFSCREEN_STYLE = { left: -9999, width: 960, height: 480 };
const MAP_STYLE = { flex: 1 };
const GLOW_STYLE = {
  lineColor: "rgba(59,130,246,0.4)",
  lineCap: "round" as const,
  lineJoin: "round" as const,
  lineWidth: 10,
  lineBlur: 4,
};
const CORE_STYLE = {
  lineColor: "#3b82f6",
  lineWidth: 4,
  lineCap: "round" as const,
  lineJoin: "round" as const,
};

export default function ActivityFinishedScreen() {
  const { t } = useTranslation("activities");
  const summary = useActivitySessionSummaryStore((state) => state.summary);
  const clearSummary = useActivitySessionSummaryStore(
    (state) => state.clearSummary,
  );
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("activity-");
  const [cardScale, setCardScale] = useState(0.3);
  const [hideMapDetails, setHideMapDetails] = useState(false);

  const {
    mapViewRef,
    mapSnapshotUri,
    isLoadingSnapshot,
    routeFeature,
    bounds,
    startEndGeoJSON,
    onMapDidFinishLoading,
    noLabelsStyleJSON,
    privacyStyleReady,
  } = useMapSnapshot(summary?.route ?? null, hideMapDetails);

  const availableStats = useMemo(
    () => (summary ? getAvailableStats(summary, t) : []),
    [summary, t],
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() =>
    getDefaultSelectedKeys(availableStats),
  );

  // Update selected keys when available stats change (initial load)
  useEffect(() => {
    if (availableStats.length > 0 && selectedKeys.size === 0) {
      setSelectedKeys(getDefaultSelectedKeys(availableStats));
    }
  }, [availableStats, selectedKeys.size]);

  const selectedStats = useMemo(
    () => availableStats.filter((s) => selectedKeys.has(s.key)),
    [availableStats, selectedKeys],
  );

  const handleToggle = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const scale = (containerWidth - 40) / 1080;
    setCardScale(Math.min(scale, 0.4));
  }, []);

  const cardContainerStyle = useMemo(
    () => ({
      width: 1080 * cardScale,
      height: 1080 * cardScale,
      overflow: "hidden" as const,
    }),
    [cardScale],
  );

  const cardTransformStyle = useMemo(
    () => ({
      transform: [{ scale: cardScale }],
      transformOrigin: "top left" as const,
    }),
    [cardScale],
  );

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      clearSummary();
    });
    return unsubscribe;
  }, [navigation, clearSummary]);

  return (
    <View className="flex-1 px-5" onLayout={onContainerLayout}>
      {/* Header */}
      <View className="items-center mt-10">
        <View className="flex-row gap-5 items-center">
          <AppText className="text-2xl" numberOfLines={1}>
            {t("activities.share.activityFinished")}
          </AppText>
          <Image
            source={require("@/assets/images/confetti.png")}
            className="w-10 h-10"
          />
        </View>
      </View>

      {/* Share Card Preview - centered */}
      <View className="flex-1 items-center justify-center">
        {summary && (
          <View style={cardContainerStyle}>
            <View style={cardTransformStyle}>
              <ActivityShareCard
                ref={cardRef}
                title={summary.title}
                date={summary.date}
                activityName={summary.activityName}
                hasRoute={summary.hasRoute}
                mapSnapshotUri={mapSnapshotUri}
                selectedStats={selectedStats}
              />
            </View>
          </View>
        )}
      </View>

      {/* Stat Toggle Chips + Privacy Toggle */}
      {summary && (
        <View className="mt-4 gap-3">
          {availableStats.length > 2 && (
            <View>
              <AppText className="text-sm text-gray-400 mb-2">
                {t("activities.share.selectStats")}
              </AppText>
              <StatToggleChips
                availableStats={availableStats}
                selectedKeys={selectedKeys}
                onToggle={handleToggle}
              />
            </View>
          )}
          {summary.hasRoute && (
            <AnimatedButton
              onPress={() => setHideMapDetails((prev) => !prev)}
              className={`px-4 py-2 rounded-full border self-start ${
                hideMapDetails
                  ? "bg-blue-700 border-blue-500"
                  : "bg-transparent border-gray-500"
              }`}
            >
              <AppText
                className={`text-sm ${hideMapDetails ? "text-gray-100" : "text-gray-400"}`}
              >
                {t("activities.share.hideMapDetails")}
              </AppText>
            </AnimatedButton>
          )}
        </View>
      )}

      {/* Bottom buttons */}
      <View className="w-full gap-4 pb-10 mt-6">
        {summary && (
          <View className="flex-row gap-4">
            <AnimatedButton
              onPress={async () => {
                const success = await saveCardToGallery();
                Toast.show({
                  type: success ? "success" : "error",
                  text1: success
                    ? t("activities.share.saveSuccess")
                    : t("common:common.error"),
                  text2: success
                    ? undefined
                    : t("activities.share.saveError"),
                });
              }}
              tabClassName="flex-1"
              className="btn-neutral flex-row items-center justify-center gap-2"
              disabled={isSaving || isSharing || isLoadingSnapshot}
            >
              <Download color="#f3f4f6" size={20} />
              <AppText className="text-base text-center">
                {isSaving
                  ? t("activities.share.saving")
                  : t("activities.share.save")}
              </AppText>
            </AnimatedButton>
            <AnimatedButton
              onPress={async () => {
                const success = await shareCard();
                if (!success) {
                  Toast.show({
                    type: "error",
                    text1: t("common:common.error"),
                    text2: t("activities.share.shareError"),
                  });
                }
              }}
              tabClassName="flex-1"
              className="btn-base flex-row items-center justify-center gap-2"
              disabled={isSharing || isSaving || isLoadingSnapshot}
            >
              <Share2 color="#f3f4f6" size={20} />
              <AppText className="text-base text-center">
                {isSharing
                  ? t("activities.share.sharing")
                  : t("activities.share.shareActivity")}
              </AppText>
            </AnimatedButton>
          </View>
        )}
        <LinkButton href="/dashboard">
          <AppText className="text-center">
            {t("activities.share.done")}
          </AppText>
        </LinkButton>
      </View>

      {/* Hidden MapView for snapshot (offscreen, needs real dimensions) */}
      {summary?.hasRoute &&
        routeFeature &&
        bounds &&
        !mapSnapshotUri &&
        (!hideMapDetails || privacyStyleReady) && (
        <View className="absolute" style={OFFSCREEN_STYLE}>
          <Mapbox.MapView
            ref={mapViewRef}
            key={hideMapDetails ? "private" : "normal"}
            style={MAP_STYLE}
            {...(hideMapDetails && noLabelsStyleJSON
              ? { styleJSON: noLabelsStyleJSON }
              : { styleURL: Mapbox.StyleURL.Dark })}
            scaleBarEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}
            onDidFinishLoadingMap={onMapDidFinishLoading}
          >
            {!hideMapDetails && (
              <Mapbox.Images
                images={{
                  start: require("@/assets/images/start-image.png"),
                  end: require("@/assets/images/finnish-image.png"),
                }}
              />
            )}
            <Mapbox.Camera
              bounds={{
                ne: bounds.ne,
                sw: bounds.sw,
                paddingTop: 50,
                paddingBottom: 50,
                paddingLeft: 50,
                paddingRight: 50,
              }}
              animationMode="none"
            />
            <Mapbox.ShapeSource id="snapshot-track" shape={routeFeature as GeoJSON.Feature}>
              <Mapbox.LineLayer id="snapshot-glow" style={GLOW_STYLE} />
              <Mapbox.LineLayer
                id="snapshot-core"
                aboveLayerID="snapshot-glow"
                style={CORE_STYLE}
              />
            </Mapbox.ShapeSource>
            {!hideMapDetails && startEndGeoJSON && (
              <Mapbox.ShapeSource id="snapshot-points" shape={startEndGeoJSON as GeoJSON.FeatureCollection}>
                <Mapbox.SymbolLayer
                  id="snapshot-points-layer"
                  style={{
                    iconImage: [
                      "case",
                      ["==", ["get", "type"], "start"],
                      "start",
                      "end",
                    ],
                    iconSize: 0.12,
                    iconAnchor: "bottom",
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
              </Mapbox.ShapeSource>
            )}
          </Mapbox.MapView>
        </View>
      )}
    </View>
  );
}
