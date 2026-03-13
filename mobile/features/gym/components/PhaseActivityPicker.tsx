import { View } from "react-native";
import FullScreenModal from "@/components/FullScreenModal";
import ActivityDropdown from "@/features/activities/components/activityDropdown";
import AppText from "@/components/AppText";
import { activities_with_category } from "@/types/models";
import { PhaseInputMode, PhaseType } from "@/types/session";
import { useTranslation } from "react-i18next";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  phaseType: PhaseType;
  isTemplate?: boolean;
  onSelect: (
    activity: activities_with_category,
    inputMode: PhaseInputMode,
  ) => void;
  onSelectTemplate?: (activity: activities_with_category) => void;
};

export default function PhaseActivityPicker({
  isOpen,
  onClose,
  isTemplate = false,
  onSelect,
  onSelectTemplate,
}: Props) {
  const { t } = useTranslation("gym");

  const handleActivitySelect = (activity: activities_with_category) => {
    if (isTemplate) {
      onSelectTemplate?.(activity);
      onClose();
      return;
    }
    onSelect(activity, "live");
    onClose();
  };

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <View className="flex-1">
        <AppText className="text-xl text-center mt-6 mb-2">
          {t("gym.phase.selectActivity")}
        </AppText>
        <ActivityDropdown onSelect={handleActivitySelect} />
      </View>
    </FullScreenModal>
  );
}
