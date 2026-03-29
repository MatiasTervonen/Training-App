import { useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import ActivityShareCard from "@/features/activities/components/share/ActivityShareCard";
import StatToggleChips from "@/features/activities/components/share/StatToggleChips";
import useMapSnapshot from "@/features/activities/components/share/useMapSnapshot";
import useActivityMapConfig from "@/features/activities/components/share/useActivityMapConfig";
import useActivityShareStats from "@/features/activities/components/share/useActivityShareStats";
import MapCustomizationControls from "@/features/activities/components/share/MapCustomizationControls";
import HiddenSnapshotMapView from "@/features/activities/components/share/HiddenSnapshotMapView";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";
import { ActivitySessionSummary } from "@/lib/stores/activitySessionSummaryStore";
import { FullActivitySession } from "@/types/models";
import { SessionShareContent } from "@/types/chat";
import { useTranslation } from "react-i18next";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import ShareModalShell from "@/lib/components/share/ShareModalShell";

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

  const {
    mapStyleIndex,
    setMapStyleIndex,
    lineColorIndex,
    setLineColorIndex,
    hideMapDetails,
    setHideMapDetails,
    showGradient,
    setShowGradient,
    lineColor,
    mapStyleUrl,
    dims,
    mapDims,
  } = useActivityMapConfig({ size, visible });

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
    markersClose,
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

  const {
    availableStats,
    selectedKeys,
    selectedStats,
    handleToggle,
  } = useActivityShareStats({ summary, visible });

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
            <MapCustomizationControls
              mapStyleIndex={mapStyleIndex}
              onMapStyleChange={setMapStyleIndex}
              lineColorIndex={lineColorIndex}
              onLineColorChange={setLineColorIndex}
              hideMapDetails={hideMapDetails}
              onHideMapDetailsChange={() => setHideMapDetails((prev: boolean) => !prev)}
            />
          )}
        </View>
      )}
      outsideContent={
        showHiddenMap ? (
          <HiddenSnapshotMapView
            mapViewRef={mapViewRef}
            mapDims={mapDims}
            size={size}
            hideMapDetails={hideMapDetails}
            lineColorIndex={lineColorIndex}
            mapStyleIndex={mapStyleIndex}
            lineColor={lineColor}
            mapStyleUrl={mapStyleUrl}
            noLabelsStyleJSON={noLabelsStyleJSON}
            routeFeature={routeFeature as GeoJSON.Feature}
            bounds={bounds}
            startEndGeoJSON={startEndGeoJSON}
            markersClose={markersClose}
            onMapDidFinishLoading={onMapDidFinishLoading}
            onMapIdle={onMapIdle}
          />
        ) : null
      }
    />
  );
}
