import { View, Pressable, Keyboard } from "react-native";
import { useState, useCallback } from "react";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import { PhaseData, PhaseType, TemplatePhaseData } from "@/types/session";
import { LinearGradient } from "expo-linear-gradient";
import { X, ChevronDown, ChevronUp, Footprints, Flame } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDurationLong } from "@/lib/formatDate";

type LivePhaseCardProps = {
  mode: "live";
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  elapsedSeconds: number;
  steps: number;
  calories: number;
  onStop: () => void;
  onRemove: () => void;
};

type ManualPhaseCardProps = {
  mode: "manual";
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  onRemove: () => void;
  onSave: (data: {
    duration_seconds: number;
    distance_meters: number | null;
    steps: number | null;
  }) => void;
};

type CollapsedPhaseCardProps = {
  mode: "collapsed";
  phase: PhaseData;
  onRemove: () => void;
  onExpand: () => void;
  isExpanded: boolean;
};

type PendingPhaseCardProps = {
  mode: "pending";
  phaseType: PhaseType;
  activityName: string;
  activitySlug: string | null;
  onRemove: () => void;
  onSelectMode: (mode: "live" | "manual") => void;
};

type TemplatePhaseCardProps = {
  mode: "template";
  phase: TemplatePhaseData;
  onRemove: () => void;
};

type Props =
  | LivePhaseCardProps
  | ManualPhaseCardProps
  | CollapsedPhaseCardProps
  | PendingPhaseCardProps
  | TemplatePhaseCardProps;

function FixedWidthDigits({
  text,
  className,
  charWidth,
}: {
  text: string;
  className?: string;
  charWidth: number;
}) {
  return (
    <View className="flex-row">
      {text.split("").map((char, i) => (
        <View key={i} style={{ width: char === ":" ? charWidth * 0.5 : charWidth, alignItems: "center" }}>
          <AppText className={className}>{char}</AppText>
        </View>
      ))}
    </View>
  );
}

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
        className="rounded-md overflow-hidden border-2 border-emerald-600 p-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <AppText className="text-lg flex-1" numberOfLines={1}>
            {phaseLabel(props.phaseType)}:{" "}
            {getTranslatedName(props.activityName, props.activitySlug)}
          </AppText>
          <AnimatedButton onPress={props.onRemove} hitSlop={10}>
            <X color="#f87171" size={20} />
          </AnimatedButton>
        </View>
        <View className="flex-row justify-center gap-6 mb-4">
          <FixedWidthDigits
            text={formatDurationLong(props.elapsedSeconds)}
            className="text-2xl"
            charWidth={17}
          />
          <View className="flex-row items-center gap-1">
            <Footprints color="#9ca3af" size={20} />
            <FixedWidthDigits
              text={props.steps.toLocaleString()}
              className="text-2xl"
              charWidth={17}
            />
          </View>
          <View className="flex-row items-center gap-1">
            <Flame color="#f97316" size={20} />
            <FixedWidthDigits
              text={String(props.calories)}
              className="text-2xl"
              charWidth={17}
            />
          </View>
        </View>
        <AnimatedButton
          onPress={props.onStop}
          className="btn-danger py-1 items-center"
        >
          <AppText className="text-base">{t("gym.phase.stop")}</AppText>
        </AnimatedButton>
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
        className="rounded-md overflow-hidden border-2 border-blue-600 p-4"
      >
        <View className="flex-row items-center justify-between mb-4">
          <AppText className="text-lg flex-1" numberOfLines={1}>
            {phaseLabel(props.phaseType)}:{" "}
            {getTranslatedName(props.activityName, props.activitySlug)}
          </AppText>
          <AnimatedButton onPress={props.onRemove} hitSlop={10}>
            <X color="#f87171" size={20} />
          </AnimatedButton>
        </View>
        <View className="flex-row gap-3">
          <AnimatedButton
            onPress={() => props.onSelectMode("live")}
            className="btn-base flex-1 py-2 items-center"
          >
            <AppText className="text-base">{t("gym.phase.trackLive")}</AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => props.onSelectMode("manual")}
            className="btn-neutral flex-1 py-2 items-center"
          >
            <AppText className="text-base">{t("gym.phase.enterManually")}</AppText>
          </AnimatedButton>
        </View>
      </LinearGradient>
    );
  }

  if (props.mode === "template") {
    return (
      <LinearGradient
        colors={["#1e3a8a", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-md overflow-hidden border-2 border-blue-600 p-3 flex-row items-center justify-between"
      >
        <AppText className="text-base flex-1" numberOfLines={1}>
          {phaseLabel(props.phase.phase_type)}:{" "}
          {getTranslatedName(props.phase.activity_name, props.phase.activity_slug)}
        </AppText>
        <AnimatedButton onPress={props.onRemove} hitSlop={10}>
          <X color="#f87171" size={20} />
        </AnimatedButton>
      </LinearGradient>
    );
  }

  // collapsed mode
  const { phase, onRemove, onExpand, isExpanded } = props;
  const formattedDuration = formatDurationLong(phase.duration_seconds);
  const summary = [
    formattedDuration,
    phase.steps ? `${phase.steps.toLocaleString()} ${t("gym.phase.stepsLabel")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-md overflow-hidden border-2 border-blue-600"
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
            {phaseLabel(phase.phase_type)}: {getTranslatedName(phase.activity_name, phase.activity_slug)} · {summary}
          </AppText>
        </View>
        <AnimatedButton
          onPress={onRemove}
          hitSlop={10}
        >
          <X color="#f87171" size={20} />
        </AnimatedButton>
      </AnimatedButton>

      {isExpanded && (
        <View className="px-4 pb-4 gap-2">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <AppText className="text-sm text-gray-400">
                {t("gym.phase.time")}
              </AppText>
              <AppText>{formattedDuration}</AppText>
            </View>
            {phase.steps != null && (
              <View className="flex-1">
                <AppText className="text-sm text-gray-400">
                  {t("gym.phase.steps")}
                </AppText>
                <AppText>{phase.steps.toLocaleString()}</AppText>
              </View>
            )}
            {phase.distance_meters != null && (
              <View className="flex-1">
                <AppText className="text-sm text-gray-400">
                  {t("gym.phase.distance")}
                </AppText>
                <AppText>{phase.distance_meters}</AppText>
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
  onRemove,
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
        className="rounded-md overflow-hidden border-2 border-blue-600 p-4"
      >
        <View className="flex-row items-center justify-between mb-4">
          <AppText className="text-lg flex-1" numberOfLines={1}>
            {phaseLabel}: {translatedName}
          </AppText>
          <AnimatedButton onPress={onRemove} hitSlop={10}>
            <X color="#f87171" size={20} />
          </AnimatedButton>
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
          <AppInput
            value={stepsInput}
            onChangeText={setStepsInput}
            placeholder={t("gym.phase.steps")}
            label={t("gym.phase.steps")}
            keyboardType="numeric"
          />
          <AnimatedButton
            onPress={handleSave}
            className="btn-base py-2 items-center mt-2"
          >
            <AppText className="text-lg">{t("gym.phase.save")}</AppText>
          </AnimatedButton>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
