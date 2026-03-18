import { useMemo } from "react";
import ShareCard from "@/features/gym/components/ShareCard";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import { ExerciseEntry } from "@/types/session";
import { useTranslation } from "react-i18next";
import ShareModalShell from "@/lib/components/share/ShareModalShell";

type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
  gymSession: FullGymSession;
  weightUnit: string;
};

export default function ShareModal({
  visible,
  onClose,
  gymSession,
  weightUnit,
}: ShareModalProps) {
  const { t } = useTranslation("gym");

  const shareExercises = useMemo<ExerciseEntry[]>(() => {
    return (gymSession.gym_session_exercises || []).map((ex) => ({
      exercise_id: ex.gym_exercises?.id ?? "",
      name: ex.gym_exercises?.name ?? "",
      equipment: ex.gym_exercises?.equipment ?? "",
      main_group: ex.gym_exercises?.main_group,
      muscle_group: ex.gym_exercises?.muscle_group,
      superset_id: ex.superset_id,
      notes: ex.notes,
      sets: (ex.gym_sets ?? []).map((s) => ({
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
      })),
    }));
  }, [gymSession.gym_session_exercises]);

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="gym-"
      labels={{
        save: t("gym.share.save"),
        saving: t("gym.share.saving"),
        share: t("gym.share.share"),
        sharing: t("gym.share.sharing"),
        close: t("gym.share.close"),
        saveSuccess: t("gym.share.saveSuccess"),
        saveError: t("gym.share.saveError"),
        shareError: t("gym.share.shareError"),
        error: t("common:common.error"),
      }}
      renderCard={({ cardRef, theme, size }) => (
        <ShareCard
          ref={cardRef}
          title={gymSession.title}
          date={gymSession.created_at}
          duration={gymSession.duration}
          exercises={shareExercises}
          weightUnit={weightUnit}
          theme={theme}
          size={size}
        />
      )}
    />
  );
}
