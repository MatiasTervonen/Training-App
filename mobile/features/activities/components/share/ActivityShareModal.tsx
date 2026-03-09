import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, ScrollView, LayoutChangeEvent, ActivityIndicator, PixelRatio } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ActivityShareCard from "@/features/activities/components/share/ActivityShareCard";
import StatToggleChips from "@/features/activities/components/share/StatToggleChips";
import useMapSnapshot from "@/features/activities/components/share/useMapSnapshot";
import useShareCard from "@/lib/hooks/useShareCard";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";
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
import { MAP_STYLES, LINE_COLORS } from "@/features/activities/lib/mapConstants";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";

const MAP_VIEW_STYLE = { flex: 1 };

const ROUTE_SCALE: Record<string, number> = {
  square: 1,
  story: 1.8,
  wide: 1.3,
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
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("activity-");

  const {
    theme: themeId,
    size,
    setTheme,
    setSize,
  } = useShareCardPreferences();

  const insets = useSafeAreaInsets();

  // Local-only map style + route color (don't affect global settings)
  const globalMapStyleIndex = useActivitySettingsStore((s) => {
    const idx = MAP_STYLES.findIndex((m) => m.url === s.defaultMapStyle);
    return idx >= 0 ? idx : 0;
  });
  const globalLineColorIndex = useActivitySettingsStore(
    (s) => s.defaultLineColorIndex,
  );

  const [mapStyleIndex, setMapStyleIndex] = useState(globalMapStyleIndex);
  const [lineColorIndex, setLineColorIndex] = useState(globalLineColorIndex);
  const [hideMapDetails, setHideMapDetails] = useState(false);
  const [showGradient, setShowGradient] = useState(true);

  // Reset to global defaults when modal opens
  useEffect(() => {
    if (visible) {
      setMapStyleIndex(globalMapStyleIndex);
      setLineColorIndex(globalLineColorIndex);
      setHideMapDetails(false);
      setShowGradient(true);
    }
  }, [visible, globalMapStyleIndex, globalLineColorIndex]);

  const lineColor = LINE_COLORS[lineColorIndex];
  const mapStyleUrl = MAP_STYLES[mapStyleIndex].url;

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const dims = useMemo(() => SHARE_CARD_DIMENSIONS[size], [size]);

  // Hidden MapView dimensions: divide by pixel ratio so takeSnap() produces
  // the correct physical pixel size without rendering an oversized map.
  const pixelRatio = PixelRatio.get();
  const mapDims = useMemo(
    () => ({
      width: Math.round(dims.width / pixelRatio),
      height: Math.round(dims.height / pixelRatio),
    }),
    [dims, pixelRatio],
  );

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
    onMapIdle,
    noLabelsStyleJSON,
    privacyStyleReady,
  } = useMapSnapshot(
    visible ? summary.route : null,
    hideMapDetails,
    `${mapStyleIndex}-${lineColorIndex}-${size}`,
    mapStyleUrl,
  );

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
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  // Fixed preview area height so switching sizes doesn't shift the layout
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

  const containerStyle = useMemo(
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

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard(size);
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("activities.share.shareError"),
      });
    }
  }, [shareCard, size, onClose, t]);

  const handleSave = useCallback(async () => {
    const success = await saveCardToGallery(size);
    Toast.show({
      type: success ? "success" : "error",
      text1: success
        ? t("activities.share.saveSuccess")
        : t("common:common.error"),
      text2: success ? undefined : t("activities.share.saveError"),
      topOffset: 60,
    });
  }, [saveCardToGallery, size, t]);

  const showHiddenMap =
    visible && summary.hasRoute && routeFeature && bounds &&
    (!hideMapDetails || privacyStyleReady);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-black/95 px-5"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        onLayout={onLayout}
      >
        {/* Wait for layout measurement before rendering content to prevent jump */}
        {containerHeight === 0 ? null : <>
        {/* Hidden offscreen map for snapshot capture */}
        {showHiddenMap && (
          <View
            style={{
              position: "absolute",
              top: -mapDims.height,
              left: 0,
              width: mapDims.width,
              height: mapDims.height,
              overflow: "hidden",
            }}
            pointerEvents="none"
          >
            <Mapbox.MapView
              ref={mapViewRef}
              key={`${size}-${hideMapDetails}-${lineColorIndex}`}
              style={MAP_VIEW_STYLE}
              {...(hideMapDetails && noLabelsStyleJSON
                ? { styleJSON: noLabelsStyleJSON }
                : { styleURL: mapStyleUrl })}
              scaleBarEnabled={false}
              logoEnabled={false}
              attributionEnabled={false}
              onDidFinishLoadingMap={onMapDidFinishLoading}
              onMapIdle={onMapIdle}
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
                defaultSettings={{
                  bounds: {
                    ne: bounds.ne,
                    sw: bounds.sw,
                    paddingTop: Math.round(mapDims.height * 0.15),
                    paddingBottom: Math.round(mapDims.height * 0.45),
                    paddingLeft: Math.round(mapDims.width * 0.05),
                    paddingRight: Math.round(mapDims.width * 0.05),
                  },
                }}
                animationMode="none"
              />
              <Mapbox.ShapeSource
                id="snapshot-track"
                shape={routeFeature as GeoJSON.Feature}
              >
                <Mapbox.LineLayer
                  id="snapshot-glow"
                  style={{
                    lineColor: lineColor.glow,
                    lineCap: "round" as const,
                    lineJoin: "round" as const,
                    lineWidth: (20 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
                    lineBlur: (8 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
                  }}
                />
                <Mapbox.LineLayer
                  id="snapshot-core"
                  aboveLayerID="snapshot-glow"
                  style={{
                    lineColor: lineColor.core,
                    lineWidth: (9 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
                    lineCap: "round" as const,
                    lineJoin: "round" as const,
                  }}
                />
              </Mapbox.ShapeSource>
              {!hideMapDetails && startEndGeoJSON && (
                <Mapbox.ShapeSource
                  id="snapshot-points"
                  shape={startEndGeoJSON as GeoJSON.FeatureCollection}
                >
                  <Mapbox.SymbolLayer
                    id="snapshot-points-layer"
                    style={{
                      iconImage: [
                        "case",
                        ["==", ["get", "type"], "start"],
                        "start",
                        "end",
                      ],
                      iconSize: (0.12 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
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

        {/* Card preview — fixed height so switching sizes doesn't shift layout */}
        <View
          className="items-center justify-center"
          style={{ height: previewAreaHeight }}
        >
          <View style={containerStyle}>
            {/* Cold open: show placeholder until first snapshot is ready */}
            {isLoadingSnapshot && !mapSnapshotUri && summary.hasRoute ? (
              <View
                className="items-center justify-center rounded-lg"
                style={{
                  width: containerStyle.width,
                  height: containerStyle.height,
                  backgroundColor: theme.colors.background[0],
                }}
              >
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <AppText className="text-sm text-gray-400 mt-3">
                  {t("activities.share.loadingMap")}
                </AppText>
              </View>
            ) : (
              <>
                <View style={transformStyle}>
                  <ActivityShareCard
                    key={`${showGradient}`}
                    ref={cardRef}
                    title={summary.title}
                    date={summary.date}
                    activityName={summary.activityName}
                    activitySlug={summary.activitySlug}
                    hasRoute={summary.hasRoute}
                    mapSnapshotUri={mapSnapshotUri}
                    selectedStats={selectedStats}
                    theme={theme}
                    size={size}
                    showGradient={showGradient}
                  />
                </View>
                {/* Loading overlay while map snapshot is re-rendering */}
                {isLoadingSnapshot && mapSnapshotUri && (
                  <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-lg">
                    <ActivityIndicator size="large" color="#ffffff" />
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Middle content — toggles, pickers */}
        <ScrollView className="flex-1 mt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}>
          {/* Top: controls */}
          <View className="gap-5">
            {availableStats.length > 2 && (
              <View className="w-full">
                <StatToggleChips
                  availableStats={availableStats}
                  selectedKeys={selectedKeys}
                  onToggle={handleToggle}
                />
              </View>
            )}

            {summary.hasRoute && (
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
                        onPress={() => setMapStyleIndex(i)}
                        className={`px-4 py-2 rounded-full border ${
                          mapStyleIndex === i
                            ? "bg-blue-700 border-blue-500"
                            : "bg-transparent border-gray-600"
                        }`}
                      >
                        <AppText
                          className={`text-sm ${mapStyleIndex === i ? "text-gray-100" : "text-gray-400"}`}
                        >
                          {t(`activities.settings.mapStyles.${style.labelKey}`)}
                        </AppText>
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
                        onPress={() => setLineColorIndex(i)}
                        className="items-center gap-1"
                      >
                        <View
                          className={`w-[32px] h-[32px] rounded-full ${
                            lineColorIndex === i
                              ? "border-2 border-white"
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
                  onPress={() => setHideMapDetails((prev) => !prev)}
                  className={`px-4 py-2 rounded-full border self-start ${
                    hideMapDetails
                      ? "bg-blue-700 border-blue-500"
                      : "bg-transparent border-gray-600"
                  }`}
                >
                  <AppText
                    className={`text-sm ${hideMapDetails ? "text-gray-100" : "text-gray-400"}`}
                  >
                    {t("activities.share.hideMapDetails")}
                  </AppText>
                </AnimatedButton>
              </View>
            )}

            <View className="w-full">
              <ShareCardPicker
                selectedSize={size}
                onSizeChange={setSize}
                selectedTheme={themeId}
                onThemeChange={setTheme}
                showGradient={showGradient}
                onShowGradientChange={setShowGradient}
              />
            </View>
          </View>

          {/* Bottom buttons */}
          <View className="w-full gap-3 mt-8">
            <View className="flex-row gap-3">
              <AnimatedButton
                onPress={handleSave}
                className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
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
                className="flex-1 btn-base flex-row items-center justify-center gap-2"
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
        </ScrollView>
        </>}
      </View>
      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
