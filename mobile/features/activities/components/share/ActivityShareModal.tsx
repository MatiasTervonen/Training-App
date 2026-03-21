import { useCallback, useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, PixelRatio } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ActivityShareCard from "@/features/activities/components/share/ActivityShareCard";
import StatToggleChips from "@/features/activities/components/share/StatToggleChips";
import useMapSnapshot from "@/features/activities/components/share/useMapSnapshot";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";
import {
  getAvailableStats,
  getDefaultSelectedKeys,
} from "@/features/activities/lib/activityShareCardUtils";
import { ActivitySessionSummary } from "@/lib/stores/activitySessionSummaryStore";
import { FullActivitySession } from "@/types/models";
import { SessionShareContent } from "@/types/chat";
import { useTranslation } from "react-i18next";
import Mapbox from "@rnmapbox/maps";
import {
  MAP_STYLES,
  LINE_COLORS,
} from "@/features/activities/lib/mapConstants";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import ShareModalShell from "@/lib/components/share/ShareModalShell";
import AppTextNC from "@/components/AppTextNC";

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

  const { size } = useShareCardPreferences();

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
      isStepRelevant: activitySession.activity?.is_step_relevant ?? true,
      isCaloriesRelevant: activitySession.activity?.is_calories_relevant ?? true,
    };
  }, [activitySession]);

  const sessionData = useMemo<SessionShareContent>(() => {
    const stats = activitySession.stats;
    const statObj: Record<string, number> = {
      duration: activitySession.session.duration ?? 0,
    };
    if (stats?.distance_meters) statObj.distance_meters = stats.distance_meters;
    if (stats?.avg_pace) statObj.avg_pace = stats.avg_pace;
    if (stats?.calories) statObj.calories = stats.calories;
    if (stats?.steps) statObj.steps = stats.steps;
    return {
      session_type: "activity_sessions",
      source_id: activitySession.session.id,
      title: activitySession.session.title,
      activity_name: activitySession.activity?.name ?? undefined,
      stats: statObj,
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

  const showHiddenMap =
    visible &&
    summary.hasRoute &&
    routeFeature &&
    bounds &&
    (!hideMapDetails || privacyStyleReady);

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="activity-"
      scrollable
      extraDisabled={isLoadingSnapshot}
      sessionData={sessionData}
      shareCardPickerProps={{
        showGradient,
        onShowGradientChange: setShowGradient,
      }}
      labels={{
        save: t("activities.share.save"),
        saving: t("activities.share.saving"),
        share: t("activities.share.share"),
        sharing: t("activities.share.sharing"),
        close: t("activities.share.close"),
        saveSuccess: t("activities.share.saveSuccess"),
        saveError: t("activities.share.saveError"),
        shareError: t("activities.share.shareError"),
        error: t("common:common.error"),
      }}
      renderCard={({ cardRef, theme: cardTheme, size: cardSize }) => (
        <View style={{ width: SHARE_CARD_DIMENSIONS[cardSize].width, height: SHARE_CARD_DIMENSIONS[cardSize].height }}>
          {/* Cold open: show placeholder until first snapshot is ready */}
          {isLoadingSnapshot && !mapSnapshotUri && summary.hasRoute ? (
            <View
              className="flex-1 items-center justify-center rounded-lg"
              style={{ backgroundColor: cardTheme.colors.background[0] }}
            >
              <ActivityIndicator size="large" color={cardTheme.colors.accent} />
              <AppText className="text-sm text-gray-400 mt-3">
                {t("activities.share.loadingMap")}
              </AppText>
            </View>
          ) : (
            <>
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
                theme={cardTheme}
                size={cardSize}
                showGradient={showGradient}
              />
              {/* Loading overlay while map snapshot is re-rendering */}
              {isLoadingSnapshot && mapSnapshotUri && (
                <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-lg">
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              )}
            </>
          )}
        </View>
      )}
      middleContent={() => (
        <View className="gap-5 mt-4">
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
                      onPress={() => setLineColorIndex(i)}
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
                onPress={() => setHideMapDetails((prev) => !prev)}
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
          )}
        </View>
      )}
      outsideContent={
        showHiddenMap ? (
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
        ) : null
      }
    />
  );
}
