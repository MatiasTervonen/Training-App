import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ActivityShareCard from "@/features/activities/components/share/ActivityShareCard";
import StatToggleChips from "@/features/activities/components/share/StatToggleChips";
import useMapSnapshot from "@/features/activities/components/share/useMapSnapshot";
import useShareCard from "@/lib/hooks/useShareCard";
import {
  getAvailableStats,
  getDefaultSelectedKeys,
} from "@/features/activities/lib/activityShareCardUtils";
import { ActivitySessionSummary } from "@/lib/stores/activitySessionSummaryStore";
import { FullActivitySession } from "@/types/models";
import { Download, Share2 } from "lucide-react-native";
import ToastMessage from "react-native-toast-message";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { toastConfig } from "@/lib/config/toast";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
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

type ActivityShareModalProps = {
  visible: boolean;
  onClose: () => void;
  activitySession: FullActivitySession;
};

export default function ActivityShareModal({
  visible,
  onClose,
  activitySession,
}: ActivityShareModalProps) {
  const { t } = useTranslation("activities");
  const [shareCardScale, setShareCardScale] = useState(0.3);
  const [hideMapDetails, setHideMapDetails] = useState(false);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("activity-");

  // Convert FullActivitySession to summary format
  const summary = useMemo<ActivitySessionSummary>(() => {
    const stats = activitySession.stats;
    const session = activitySession.session;
    const hasRoute = activitySession.route !== null;

    return {
      title: session.title,
      date: session.start_time,
      duration: session.duration ?? 0,
      activityName: activitySession.activity?.name ?? null,
      activitySlug: activitySession.activity?.slug ?? null,
      hasRoute,
      route: activitySession.route,
      distance: stats?.distance_meters ?? null,
      movingTime: stats?.moving_time_seconds ?? null,
      averagePace: stats?.avg_pace ?? null,
      averageSpeed: stats?.avg_speed ?? null,
      steps: stats?.steps ?? null,
      calories: stats?.calories ?? null,
    };
  }, [activitySession]);

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
  } = useMapSnapshot(visible ? summary.route : null, hideMapDetails);

  const availableStats = useMemo(
    () => getAvailableStats(summary, t),
    [summary, t],
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() =>
    getDefaultSelectedKeys(availableStats),
  );

  // Reset selected keys when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedKeys(getDefaultSelectedKeys(availableStats));
    }
  }, [visible, availableStats]);

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

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const scale = (containerWidth - 40) / 1080;
    setShareCardScale(Math.min(scale, 0.4));
  }, []);

  const containerStyle = useMemo(
    () => ({
      width: 1080 * shareCardScale,
      height: 1080 * shareCardScale,
      overflow: "hidden" as const,
    }),
    [shareCardScale],
  );

  const transformStyle = useMemo(
    () => ({
      transform: [{ scale: shareCardScale }],
      transformOrigin: "top left" as const,
    }),
    [shareCardScale],
  );

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard();
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("activities.share.shareError"),
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-black/80 justify-center items-center px-5"
        onLayout={onLayout}
      >
        <View className="w-full items-center">
          <View style={containerStyle}>
            <View style={transformStyle}>
              <ActivityShareCard
                ref={cardRef}
                title={summary.title}
                date={summary.date}
                activityName={summary.activityName}
                activitySlug={summary.activitySlug}
                hasRoute={summary.hasRoute}
                mapSnapshotUri={mapSnapshotUri}
                selectedStats={selectedStats}
              />
            </View>
          </View>

          {/* Stat Toggle Chips + Privacy Toggle */}
          <View className="w-full mt-4 gap-3">
            {availableStats.length > 2 && (
              <StatToggleChips
                availableStats={availableStats}
                selectedKeys={selectedKeys}
                onToggle={handleToggle}
              />
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

          <View className="mt-6 w-full gap-3">
            <View className="flex-row gap-3">
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
                    topOffset: 60,
                  });
                }}
                tabClassName="flex-1"
                className="btn-neutral flex-row items-center justify-center gap-2"
                disabled={isSaving || isSharing || isLoadingSnapshot}
              >
                <Download color="#f3f4f6" size={18} />
                <AppText className="text-base text-center" numberOfLines={1}>
                  {isSaving
                    ? t("activities.share.saving")
                    : t("activities.share.save")}
                </AppText>
              </AnimatedButton>
              <AnimatedButton
                onPress={handleShare}
                tabClassName="flex-1"
                className="btn-base flex-row items-center justify-center gap-2"
                disabled={isSharing || isSaving || isLoadingSnapshot}
              >
                <Share2 color="#f3f4f6" size={18} />
                <AppText className="text-base text-center" numberOfLines={1}>
                  {isSharing
                    ? t("activities.share.sharing")
                    : t("activities.share.share")}
                </AppText>
              </AnimatedButton>
            </View>
            <AnimatedButton
              onPress={onClose}
              className="btn-neutral items-center justify-center"
            >
              <AppText className="text-base text-center">
                {t("activities.share.close")}
              </AppText>
            </AnimatedButton>
          </View>
        </View>
      </View>

      {/* Hidden MapView for snapshot */}
      {visible &&
        summary.hasRoute &&
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
              <Mapbox.ShapeSource
                id="modal-snapshot-track"
                shape={routeFeature as GeoJSON.Feature}
              >
                <Mapbox.LineLayer id="modal-snapshot-glow" style={GLOW_STYLE} />
                <Mapbox.LineLayer
                  id="modal-snapshot-core"
                  aboveLayerID="modal-snapshot-glow"
                  style={CORE_STYLE}
                />
              </Mapbox.ShapeSource>
              {!hideMapDetails && startEndGeoJSON && (
                <Mapbox.ShapeSource
                  id="modal-snapshot-points"
                  shape={startEndGeoJSON as GeoJSON.FeatureCollection}
                >
                  <Mapbox.SymbolLayer
                    id="modal-snapshot-points-layer"
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
      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
