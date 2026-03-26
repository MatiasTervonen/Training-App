import { View, Pressable, Keyboard } from "react-native";
import { useState, useCallback } from "react";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import SaveButton from "@/components/buttons/SaveButton";
import { PhaseData, PhaseType, TemplatePhaseData } from "@/types/session";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown, ChevronUp, Footprints, Flame, Ruler } from "lucide-react-native";
import DropDownModal from "@/components/DropDownModal";
import { useTranslation } from "react-i18next";
import { formatDurationLong, formatMeters } from "@/lib/formatDate";

type LivePhaseCardProps = {
  mode: "live";
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  elapsedSeconds: number;
  steps: number;
  calories: number;
  isStepRelevant?: boolean;
  isCaloriesRelevant?: boolean;
  estimatedDistance?: number;
  onStop: () => void;
  onRemove: () => void;
  onSwitchToManual?: () => void;
  onChangeActivity?: () => void;
};

type ManualPhaseCardProps = {
  mode: "manual";
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  isStepRelevant?: boolean;
  onRemove: () => void;
  onChangeActivity?: () => void;
  onSave: (data: {
    duration_seconds: number;
    distance_meters: number | null;
    steps: number | null;
  }) => void;
};

type CollapsedPhaseCardProps = {
  mode: "collapsed";
  phase: PhaseData;
  userWeight: number;
  onRemove: () => void;
  onExpand: () => void;
  isExpanded: boolean;
  onChangeActivity?: () => void;
};


type PendingPhaseCardProps = {
  mode: "pending";
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  onStart: () => void;
  onRemove: () => void;
  onChangeActivity?: () => void;
};

type TemplatePhaseCardProps = {
  mode: "template";
  phase: TemplatePhaseData;
  onRemove: () => void;
  onChangeActivity?: () => void;
};

type Props =
  | LivePhaseCardProps
  | ManualPhaseCardProps
  | CollapsedPhaseCardProps
  | PendingPhaseCardProps
  | TemplatePhaseCardProps;

export default function PhaseCard(props: Props) {
  const { t } = useTranslation("gym");
  const { t: tActivities } = useTranslation("activities");

  const phaseLabel = (phaseType: PhaseType) =>
    phaseType === "warmup"
      ? t("gym.phase.warmup")
      : t("gym.phase.cooldown");

  const getTranslatedName = useCallback(
    (name: string, slug: string | null) => {
      if (slug) {
        const translated = tActivities(
          `activities.activityNames.${slug}`,
          { defaultValue: "" },
        );
        if (
          translated &&
          translated !== `activities.activityNames.${slug}`
        ) {
          return translated;
        }
      }
      return name;
    },
    [tActivities],
  );

  if (props.mode === "live") {
    return (
      <LinearGradient
        colors={["#065f46", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-md overflow-hidden border-[1.5px] border-emerald-600 p-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <AppText className="text-lg flex-1" numberOfLines={1}>
            {phaseLabel(props.phaseType)}:{" "}
            {getTranslatedName(props.activityName, props.activitySlug)}
          </AppText>
          <DropDownModal
            label={`${phaseLabel(props.phaseType)}: ${getTranslatedName(props.activityName, props.activitySlug)}`}
            options={[
              ...(props.onChangeActivity
                ? [{ value: "change", label: t("gym.exerciseCard.change") }]
                : []),
              { value: "delete", label: t("gym.exerciseCard.delete") },
            ]}
            onChange={(value) => {
              if (value === "change") props.onChangeActivity?.();
              if (value === "delete") props.onRemove();
            }}
          />
        </View>
        {props.isStepRelevant !== false ? (
          <View className="flex-row flex-wrap mb-4">
            <View className="w-1/2 items-center pb-3">
              <AppText className="text-xl font-mono font-bold">
                {formatDurationLong(props.elapsedSeconds)}
              </AppText>
              <AppText className="text-xs text-gray-400 mt-1">
                {t("gym.phase.time")}
              </AppText>
            </View>
            <View className="w-1/2 items-center pb-3">
              <View className="flex-row items-center gap-1">
                <Footprints color="#9ca3af" size={16} />
                <AppText className="text-xl font-mono font-bold">
                  {props.steps.toLocaleString()}
                </AppText>
              </View>
              <AppText className="text-xs text-gray-400 mt-1">
                {t("gym.phase.steps")}
              </AppText>
            </View>
            <View className="w-1/2 items-center">
              <View className="flex-row items-center gap-1">
                <Ruler color="#60a5fa" size={16} />
                <AppText className="text-xl font-mono font-bold text-blue-300">
                  ~{formatMeters(props.estimatedDistance ?? 0)}
                </AppText>
              </View>
              <AppText className="text-xs text-gray-400 mt-1">
                {t("gym.phase.distance")}
              </AppText>
            </View>
            {props.isCaloriesRelevant !== false && (
              <View className="w-1/2 items-center">
                <View className="flex-row items-center gap-1">
                  <Flame color="#f97316" size={16} />
                  <AppText className="text-xl font-mono font-bold">
                    {String(props.calories)}
                  </AppText>
                </View>
                <AppText className="text-xs text-gray-400 mt-1">
                  {t("gym.phase.calories")}
                </AppText>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-row justify-center gap-6 mb-4">
            <AppText className="text-2xl font-mono font-bold">
              {formatDurationLong(props.elapsedSeconds)}
            </AppText>
            {props.isStepRelevant !== false && (
              <View className="flex-row items-center gap-1">
                <Footprints color="#9ca3af" size={20} />
                <AppText className="text-2xl font-mono font-bold">
                  {props.steps.toLocaleString()}
                </AppText>
              </View>
            )}
            {props.isCaloriesRelevant !== false && (
              <View className="flex-row items-center gap-1">
                <Flame color="#f97316" size={20} />
                <AppText className="text-2xl font-mono font-bold">
                  {String(props.calories)}
                </AppText>
              </View>
            )}
          </View>
        )}
        <AnimatedButton
          onPress={props.onStop}
          className="btn-danger py-1 items-center"
        >
          <AppText className="text-base">{t("gym.phase.stop")}</AppText>
        </AnimatedButton>
        {props.onSwitchToManual && (
          <AnimatedButton
            onPress={props.onSwitchToManual}
            className="mt-2 items-center"
          >
            <AppText className="text-sm text-gray-400">
              {t("gym.phase.enterManuallyInstead")}
            </AppText>
          </AnimatedButton>
        )}
      </LinearGradient>
    );
  }

  if (props.mode === "manual") {
    return <ManualEntryCard {...props} />;
  }

  if (props.mode === "pending") {
    return (
      <LinearGradient
        colors={["#1e3a8a", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-md overflow-hidden border-[1.5px] border-blue-600 p-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <AppText className="text-lg flex-1" numberOfLines={1}>
            {phaseLabel(props.phaseType)}:{" "}
            {getTranslatedName(props.activityName, props.activitySlug)}
          </AppText>
          <DropDownModal
            label={`${phaseLabel(props.phaseType)}: ${getTranslatedName(props.activityName, props.activitySlug)}`}
            options={[
              ...(props.onChangeActivity
                ? [{ value: "change", label: t("gym.exerciseCard.change") }]
                : []),
              { value: "delete", label: t("gym.exerciseCard.delete") },
            ]}
            onChange={(value) => {
              if (value === "change") props.onChangeActivity?.();
              if (value === "delete") props.onRemove();
            }}
          />
        </View>
        <AnimatedButton
          onPress={props.onStart}
          className="btn-base py-2 items-center"
        >
          <AppText className="text-lg">{t("gym.phase.start")}</AppText>
        </AnimatedButton>
      </LinearGradient>
    );
  }

  if (props.mode === "template") {
    return (
      <LinearGradient
        colors={["#1e3a8a", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-md overflow-hidden border-[1.5px] border-blue-600 p-3 flex-row items-center justify-between"
      >
        <AppText className="text-base flex-1" numberOfLines={1}>
          {phaseLabel(props.phase.phase_type)}:{" "}
          {getTranslatedName(props.phase.activity_name, props.phase.activity_slug)}
        </AppText>
        <DropDownModal
          label={`${phaseLabel(props.phase.phase_type)}: ${getTranslatedName(props.phase.activity_name, props.phase.activity_slug)}`}
          options={[
            ...(props.onChangeActivity
              ? [{ value: "change", label: t("gym.phase.changeActivity") }]
              : []),
            { value: "delete", label: t("gym.exerciseCard.delete") },
          ]}
          onChange={(value) => {
            if (value === "change") props.onChangeActivity?.();
            if (value === "delete") props.onRemove();
          }}
        />
      </LinearGradient>
    );
  }

  // collapsed mode
  const { phase, userWeight, onRemove, onExpand, isExpanded, onChangeActivity } = props;
  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-md overflow-hidden border-[1.5px] border-blue-600"
    >
      <AnimatedButton
        onPress={onExpand}
        className="p-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 gap-2">
          {isExpanded ? (
            <ChevronUp color="#9ca3af" size={16} />
          ) : (
            <ChevronDown color="#9ca3af" size={16} />
          )}
          <AppText className="flex-1" numberOfLines={1}>
            {phaseLabel(phase.phase_type)}: {getTranslatedName(phase.activity_name, phase.activity_slug)}
          </AppText>
        </View>
        <DropDownModal
          label={`${phaseLabel(phase.phase_type)}: ${getTranslatedName(phase.activity_name, phase.activity_slug)}`}
          options={[
            ...(onChangeActivity
              ? [{ value: "change", label: t("gym.exerciseCard.change") }]
              : []),
            { value: "delete", label: t("gym.exerciseCard.delete") },
          ]}
          onChange={(value) => {
            if (value === "change") onChangeActivity?.();
            if (value === "delete") onRemove();
          }}
        />
      </AnimatedButton>

      {isExpanded && (
        <View className="px-3 pb-3">
          <View className="border-b border-blue-700 flex-row">
            <View className="flex-1 items-center">
              <AppText className="p-2 text-sm text-gray-400">
                {t("gym.phase.time")}
              </AppText>
            </View>
            {phase.is_step_relevant && phase.steps != null && (
              <View className="flex-1 items-center">
                <AppText className="p-2 text-sm text-gray-400">
                  {t("gym.phase.steps")}
                </AppText>
              </View>
            )}
            {phase.distance_meters != null && phase.distance_meters > 0 && (
              <View className="flex-1 items-center">
                <AppText className="p-2 text-sm text-gray-400">
                  {t("gym.phase.distance")}
                </AppText>
              </View>
            )}
            {phase.is_calories_relevant && phase.duration_seconds > 0 && (
              <View className="flex-1 items-center">
                <AppText className="p-2 text-sm text-gray-400">
                  {t("gym.phase.calories")}
                </AppText>
              </View>
            )}
          </View>
          <View className="flex-row">
            <View className="flex-1 items-center">
              <AppText className="p-2 font-mono">{formatDurationLong(phase.duration_seconds)}</AppText>
            </View>
            {phase.is_step_relevant && phase.steps != null && (
              <View className="flex-1 items-center">
                <AppText className="p-2 font-mono">{phase.steps.toLocaleString()}</AppText>
              </View>
            )}
            {phase.distance_meters != null && phase.distance_meters > 0 && (
              <View className="flex-1 items-center">
                <AppText className="p-2 font-mono">~{formatMeters(phase.distance_meters)}</AppText>
              </View>
            )}
            {phase.is_calories_relevant && phase.duration_seconds > 0 && (
              <View className="flex-1 items-center">
                <AppText className="p-2 font-mono">
                  {Math.round(phase.activity_met * userWeight * (phase.duration_seconds / 3600))}
                </AppText>
              </View>
            )}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

function ManualEntryCard({
  phaseType,
  activityName,
  activitySlug,
  isStepRelevant = true,
  onRemove,
  onChangeActivity,
  onSave,
}: ManualPhaseCardProps) {
  const { t } = useTranslation("gym");
  const { t: tActivities } = useTranslation("activities");
  const [timeMin, setTimeMin] = useState("");
  const [distance, setDistance] = useState("");
  const [stepsInput, setStepsInput] = useState("");

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
      if (
        translated &&
        translated !== `activities.activityNames.${activitySlug}`
      ) {
        return translated;
      }
    }
    return activityName;
  })();

  const handleSave = () => {
    const minutes = parseFloat(timeMin) || 0;
    if (minutes <= 0) return;
    Keyboard.dismiss();
    onSave({
      duration_seconds: Math.round(minutes * 60),
      distance_meters: distance ? parseFloat(distance) : null,
      steps: stepsInput ? parseInt(stepsInput, 10) : null,
    });
  };

  return (
    <Pressable onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#1e3a8a", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-md overflow-hidden border-[1.5px] border-blue-600 p-4"
      >
        <View className="flex-row items-center justify-between mb-4">
          <AppText className="text-lg flex-1" numberOfLines={1}>
            {phaseLabel}: {translatedName}
          </AppText>
          <DropDownModal
            label={`${phaseLabel}: ${translatedName}`}
            options={[
              ...(onChangeActivity
                ? [{ value: "change", label: t("gym.exerciseCard.change") }]
                : []),
              { value: "delete", label: t("gym.exerciseCard.delete") },
            ]}
            onChange={(value) => {
              if (value === "change") onChangeActivity?.();
              if (value === "delete") onRemove();
            }}
          />
        </View>
        <View className="gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AppInput
                value={timeMin}
                onChangeText={setTimeMin}
                placeholder={t("gym.phase.timeMin")}
                label={t("gym.phase.timeMin")}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <AppInput
                value={distance}
                onChangeText={setDistance}
                placeholder={t("gym.phase.distance")}
                label={t("gym.phase.distance")}
                keyboardType="numeric"
              />
            </View>
          </View>
          {isStepRelevant && (
            <AppInput
              value={stepsInput}
              onChangeText={setStepsInput}
              placeholder={t("gym.phase.steps")}
              label={t("gym.phase.steps")}
              keyboardType="numeric"
            />
          )}
          <SaveButton
            onPress={handleSave}
            label={t("gym.phase.save")}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
