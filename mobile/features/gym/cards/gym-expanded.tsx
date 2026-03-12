import { formatDateShort, formatDurationLong, formatTime, convertMetersForDisplay } from "@/lib/formatDate";
import { PhaseType } from "@/types/session";
import { useUserStore } from "@/lib/stores/useUserStore";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import GroupExercises from "@/features/gym/lib/GroupExercises";
import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { LinearGradient } from "expo-linear-gradient";
import PageContainer from "@/components/PageContainer";
import { History, Share2 } from "lucide-react-native";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistoryModal";
import StatCard from "@/components/StatCard";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import ShareModal from "@/features/gym/components/ShareModal";

export default function GymSession(gym_session: FullGymSession) {
  const { t } = useTranslation("gym");
  const [exerciseId, setExerciseId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const images = gym_session.sessionImages ?? [];
  const videos = gym_session.sessionVideos ?? [];
  const voiceRecordings = gym_session.sessionVoiceRecordings ?? [];

  const groupedExercises = GroupExercises(
    gym_session.gym_session_exercises || [],
  );

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const stats = useMemo(() => {
    const exercises = gym_session.gym_session_exercises || [];
    const exerciseCount = exercises.length;
    const totalSets = exercises.reduce(
      (sum, ex) => sum + (ex.gym_sets?.length ?? 0),
      0,
    );
    const muscleGroupsHit = new Set(
      exercises.map((ex) => ex.gym_exercises?.muscle_group).filter(Boolean),
    ).size;

    return { exerciseCount, totalSets, muscleGroupsHit };
  }, [gym_session.gym_session_exercises]);

  const phases = (gym_session as FullGymSession & {
    gym_session_phases?: {
      id: string;
      phase_type: string;
      activity_id: string;
      duration_seconds: number;
      steps: number | null;
      distance_meters: number | null;
      calories: number | null;
      is_manual: boolean;
      activities: { name: string; slug: string | null; base_met: number } | null;
    }[];
  }).gym_session_phases ?? [];

  const warmupPhase = phases.find((p) => p.phase_type === "warmup");
  const cooldownPhase = phases.find((p) => p.phase_type === "cooldown");

  const sessionStats = gym_session.session_stats;
  const totalVolume = sessionStats?.total_volume ?? 0;
  const calories = sessionStats?.calories ?? 0;

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}t ${weightUnit}`;
    }
    return `${Math.round(volume)} ${weightUnit}`;
  };

  const translateRpe = (rpe: string) => {
    const rpeMap: Record<string, string> = {
      "Warm-up": "1",
      Easy: "2",
      Medium: "3",
      Hard: "4",
      Failure: "5",
    };
    return rpeMap[rpe] || rpe;
  };

  const {
    data: history = [],
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["last-exercise-history", exerciseId],
    queryFn: () => getLastExerciseHistory({ exerciseId }),
    enabled: isHistoryOpen && !!exerciseId,
  });

  const openHistory = (exerciseId: string) => {
    setExerciseId(exerciseId);
    setIsHistoryOpen(true);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer className="mb-10">
        <View>
          <LinearGradient
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-5 gap-4"
          >
            <View className="w-full flex-row items-center mb-2">
              <AppText className="text-xl text-center flex-1">
                {gym_session.title}
              </AppText>
              <AnimatedButton
                onPress={() => setIsShareModalOpen(true)}
                hitSlop={10}
              >
                <Share2 color="#9ca3af" size={20} />
              </AnimatedButton>
            </View>
            <AppText className="text-sm text-gray-400">
              {formatDateShort(gym_session.start_time)}  ·  {formatTime(gym_session.start_time)} – {formatTime(gym_session.end_time)}
            </AppText>

            <View className="w-full gap-2">
              <View className="flex-row gap-2">
                <StatCard
                  label={t("gym.session.duration")}
                  value={formatDurationLong(gym_session.duration)}
                />
                <StatCard
                  label={t("gym.session.totalVolume")}
                  value={formatVolume(totalVolume)}
                />
                <StatCard
                  label={t("gym.session.calories")}
                  value={String(Math.round(calories))}
                />
              </View>
              <View className="flex-row gap-2">
                <StatCard
                  label={t("gym.session.exercises")}
                  value={String(stats.exerciseCount)}
                />
                <StatCard
                  label={t("gym.session.totalSets")}
                  value={String(stats.totalSets)}
                />
                <StatCard
                  label={t("gym.session.muscleGroups")}
                  value={String(stats.muscleGroupsHit)}
                />
              </View>
            </View>

            {gym_session.notes && (
              <BodyText className="text-gray-200 whitespace-pre-wrap break-words overflow-hidden">
                {gym_session.notes}
              </BodyText>
            )}

            {images.length > 0 && (
              <View className="w-full mt-4">
                {images.map((image, idx) => (
                  <DraftImageItem
                    key={image.id}
                    uri={image.uri}
                    onPress={() => setViewerIndex(idx)}
                  />
                ))}
              </View>
            )}

            {videos.length > 0 && (
              <View className="w-full mt-4">
                {videos.map((video) => (
                  <DraftVideoItem
                    key={video.id}
                    uri={video.uri}
                    thumbnailUri={video.thumbnailUri}
                    durationMs={video.duration_ms ?? undefined}
                  />
                ))}
              </View>
            )}

            {voiceRecordings.length > 0 && (
              <View className="w-full mt-4">
                {voiceRecordings.map((recording) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.duration_ms ?? undefined}
                  />
                ))}
              </View>
            )}
          </LinearGradient>
        </View>
        {warmupPhase && warmupPhase.activities && (
          <PhaseDisplayCard
            phaseType="warmup"
            activityName={warmupPhase.activities.name}
            activitySlug={warmupPhase.activities.slug}
            durationSeconds={warmupPhase.duration_seconds}
            steps={warmupPhase.steps}
            distanceMeters={warmupPhase.distance_meters}
            calories={warmupPhase.calories}
            t={t}
          />
        )}
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <LinearGradient
            key={superset_id}
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            className={`mt-10 rounded-md overflow-hidden  ${
              group.length > 1
                ? "border-2 border-blue-700"
                : "border-2 border-gray-600"
            }`}
          >
            {group.length > 1 && (
              <AppText className="text-lg text-gray-100 my-2 text-center">
                {t("gym.session.superSet")}
              </AppText>
            )}
            {group.map(({ exercise, index }) => (
              <View key={exercise.id} className="py-2 px-4 mb-4">
                <View className="justify-between flex-col mb-2">
                  <View className="flex-row items-center">
                    <AppText
                      className="text-lg text-gray-100 flex-1 mr-4"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {index + 1}. {exercise.gym_exercises.name}
                    </AppText>
                    <AnimatedButton
                      hitSlop={10}
                      onPress={() => openHistory(exercise.gym_exercises.id)}
                    >
                      <History color="#f3f4f6" />
                    </AnimatedButton>
                  </View>
                  <View className="flex-row items-center ">
                    <AppText className="text-gray-400 mt-1">
                      {t(
                        `gym.equipment.${exercise.gym_exercises.equipment?.toLowerCase()}`,
                      )}{" "}
                      /{" "}
                      {t(
                        `gym.muscleGroups.${exercise.gym_exercises.muscle_group?.toLowerCase().replace(/ /g, "_")}`,
                      )}
                    </AppText>
                  </View>
                </View>
                {exercise.notes && (
                  <BodyText className="py-2 overflow-hidden">
                    {exercise.notes || ""}
                  </BodyText>
                )}

                <View className="w-full">
                  <View className="border-b border-gray-600 flex-row">
                    <View className="flex-1 items-center">
                      <AppText className="p-2 text-sm text-gray-400">
                        {t("gym.session.set")}
                      </AppText>
                    </View>
                    <View className="flex-1 items-center">
                      <AppText className="p-2 text-sm text-gray-400">
                        {t("gym.session.weight")}
                      </AppText>
                    </View>
                    <View className="flex-1 items-center">
                      <AppText className="p-2 text-sm text-gray-400">
                        {t("gym.session.reps")}
                      </AppText>
                    </View>
                    <View className="flex-1 items-center">
                      <AppText className="p-2 text-sm text-gray-400">
                        {t("gym.session.rpe")}
                      </AppText>
                    </View>
                    <View className="w-8" />
                  </View>
                </View>
                <View>
                  {exercise.gym_sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      className={`border-b border-gray-600 flex-row items-center ${
                        set.rpe === "Failure"
                          ? "bg-red-500 text-white"
                          : "text-gray-100"
                      } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                    >
                      <View className="flex-1 items-center">
                        <AppText className="p-2">{setIndex + 1}</AppText>
                      </View>
                      <View className="flex-1 items-center">
                        <AppText className="p-2">
                          {set.weight} {weightUnit}
                        </AppText>
                      </View>
                      <View className="flex-1 items-center">
                        <AppText className="p-2">{set.reps}</AppText>
                      </View>
                      <View className="flex-1 items-center">
                        <AppText className="p-2" numberOfLines={1}>
                          {set.rpe ? translateRpe(set.rpe) : ""}
                        </AppText>
                      </View>
                      <View className="w-8" />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </LinearGradient>
        ))}
        {cooldownPhase && cooldownPhase.activities && (
          <PhaseDisplayCard
            phaseType="cooldown"
            activityName={cooldownPhase.activities.name}
            activitySlug={cooldownPhase.activities.slug}
            durationSeconds={cooldownPhase.duration_seconds}
            steps={cooldownPhase.steps}
            distanceMeters={cooldownPhase.distance_meters}
            calories={cooldownPhase.calories}
            t={t}
          />
        )}
      </PageContainer>

      <ExerciseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isLoading={isLoading}
        history={Array.isArray(history) ? history : []}
        error={historyError ? historyError.message : null}
      />

      {images.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={images}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}

      <ShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gymSession={gym_session}
        weightUnit={weightUnit}
      />
    </ScrollView>
  );
}

function PhaseDisplayCard({
  phaseType,
  activityName,
  activitySlug,
  durationSeconds,
  steps,
  distanceMeters,
  calories,
  t,
}: {
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  durationSeconds: number;
  steps: number | null;
  distanceMeters: number | null;
  calories: number | null;
  t: (key: string) => string;
}) {
  const { t: tActivities } = useTranslation("activities");
  const formattedTime = formatDurationLong(durationSeconds);
  const phaseLabel =
    phaseType === "warmup"
      ? t("gym.phase.warmup")
      : t("gym.phase.cooldown");

  const translatedName = (() => {
    if (activitySlug) {
      const translated = tActivities(
        `activities.activityNames.${activitySlug}`,
        { defaultValue: "" },
      );
      if (translated && translated !== `activities.activityNames.${activitySlug}`) {
        return translated;
      }
    }
    return activityName;
  })();

  return (
    <LinearGradient
      colors={["#065f46", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="mt-5 rounded-md overflow-hidden border-2 border-emerald-600 p-4"
    >
      <AppText className="text-lg mb-2">
        {phaseLabel}: {translatedName}
      </AppText>
      <View className="w-full">
        <View className="border-b border-emerald-700 flex-row">
          <View className="flex-1 items-center">
            <AppText className="p-2 text-sm text-gray-400">
              {t("gym.phase.time")}
            </AppText>
          </View>
          {steps != null && steps > 0 && (
            <View className="flex-1 items-center">
              <AppText className="p-2 text-sm text-gray-400">
                {t("gym.phase.stepsLabel")}
              </AppText>
            </View>
          )}
          {distanceMeters != null && distanceMeters > 0 && (
            <View className="flex-1 items-center">
              <AppText className="p-2 text-sm text-gray-400">
                {t("gym.phase.distance")}
              </AppText>
            </View>
          )}
          {calories != null && calories > 0 && (
            <View className="flex-1 items-center">
              <AppText className="p-2 text-sm text-gray-400">
                {t("gym.session.calories")}
              </AppText>
            </View>
          )}
        </View>
        <View className="border-b border-emerald-700 flex-row">
          <View className="flex-1 items-center">
            <AppText className="p-2">{formattedTime}</AppText>
          </View>
          {steps != null && steps > 0 && (
            <View className="flex-1 items-center">
              <AppText className="p-2">{steps.toLocaleString()}</AppText>
            </View>
          )}
          {distanceMeters != null && distanceMeters > 0 && (
            <View className="flex-1 items-center">
              <AppText className="p-2">{convertMetersForDisplay(distanceMeters)}</AppText>
            </View>
          )}
          {calories != null && calories > 0 && (
            <View className="flex-1 items-center">
              <AppText className="p-2">{Math.round(calories)}</AppText>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}
