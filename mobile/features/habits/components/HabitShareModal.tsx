import { useTranslation } from "react-i18next";
import HabitShareCard from "@/features/habits/components/HabitShareCard";
import { HabitStats } from "@/types/habit";
import ShareModalShell from "@/lib/components/share/ShareModalShell";

type HabitShareModalProps = {
  visible: boolean;
  onClose: () => void;
  habitName: string;
  stats: HabitStats;
};

export default function HabitShareModal({
  visible,
  onClose,
  habitName,
  stats,
}: HabitShareModalProps) {
  const { t } = useTranslation("habits");

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="habit-"
      labels={{
        save: t("share.save"),
        saving: t("share.saving"),
        share: t("share.share"),
        sharing: t("share.sharing"),
        close: t("share.close"),
        saveSuccess: t("share.saveSuccess"),
        saveError: t("share.saveError"),
        shareError: t("share.shareError"),
        error: t("common:common.error"),
      }}
      renderCard={({ cardRef, theme, size }) => (
        <HabitShareCard
          ref={cardRef}
          habitName={habitName}
          stats={stats}
          theme={theme}
          size={size}
        />
      )}
    />
  );
}
