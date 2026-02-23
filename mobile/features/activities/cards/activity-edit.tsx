import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useState, useCallback, useEffect } from "react";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import SubNotesInput from "@/components/SubNotesInput";
import ActivityDropdown from "@/features/activities/components/activityDropdown";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenModal from "@/components/FullScreenModal";
import { activities_with_category, FullActivitySession } from "@/types/models";
import { editActivitySession } from "@/database/activities/edit-session";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";
import { Dot } from "lucide-react-native";

type Props = {
  activity: FullActivitySession & { feed_context: "pinned" | "feed" };
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function ActivitySessionEdit({
  activity,
  onClose,
  onSave,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation("activities");
  const [title, setTitle] = useState(activity?.session.title || "");
  const [notes, setNotes] = useState(activity?.session.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category>(
      activity?.activity as activities_with_category,
    );

  const [originalData] = useState({
    title: activity?.session.title || "",
    notes: activity?.session.notes || "",
    activityId: activity?.activity?.id,
  });

  const hasChanges =
    title !== originalData.title ||
    notes !== originalData.notes ||
    selectedActivity?.id !== originalData.activityId;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const getActivityName = useCallback(
    (act: activities_with_category | null) => {
      if (!act) return t("activities.editSession.selectActivity");
      if (act.slug) {
        const translated = t(`activities.activityNames.${act.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.activityNames.${act.slug}`
        ) {
          return translated;
        }
      }
      return act.name;
    },
    [t],
  );

  const handleSubmit = async () => {
    if (title.trim() === "") {
      Toast.show({
        type: "error",
        text1: t("activities.editSession.errorTitle"),
        text2: t("activities.editSession.errorEmptyTitle"),
      });
      return;
    }

    try {
      setIsLoading(true);
      const updatedFeedItem = await editActivitySession({
        id: activity.session.id,
        title,
        notes,
        activityId: selectedActivity!.id,
      });

      onSave({ ...updatedFeedItem, feed_context: activity.feed_context });
      onClose();
    } catch (error) {
      console.error("Error saving activity session", error);
      Toast.show({
        type: "error",
        text1: t("activities.editSession.errorTitle"),
        text2: t("activities.editSession.errorGeneric"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">{t("common:common.unsavedChanges")}</AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer className="justify-between mb-10 mt-5">
          <View className="gap-5">
          <AppText className="text-xl text-center mb-5">
            {t("activities.editSession.title")}
          </AppText>
          <AppInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("activities.editSession.sessionTitlePlaceholder")}
            label={t("activities.editSession.sessionTitleLabel")}
          />
          <SubNotesInput
            value={notes}
            setValue={setNotes}
            placeholder={t("activities.editSession.sessionNotesPlaceholder")}
            label={t("activities.editSession.sessionNotesLabel")}
          />
          <View>
            <AppText className="mb-2">
              {t("activities.editSession.selectActivity")}
            </AppText>
            <AnimatedButton
              onPress={() => setShowDropdown(true)}
              label={getActivityName(selectedActivity)}
              className="bg-blue-800 py-2 w-full rounded-md shadow-md border-2 border-blue-500"
              textClassName="text-gray-100 text-center"
            />
          </View>
          <FullScreenModal
            isOpen={showDropdown}
            onClose={() => setShowDropdown(false)}
          >
            <AppText className="text-2xl text-center my-10">
              {t("activities.editSession.selectActivity")}
            </AppText>
            <ActivityDropdown
              onSelect={(activity) => {
                setSelectedActivity(activity);
                setShowDropdown(false);
              }}
            />
            <View className="h-5" />
          </FullScreenModal>
        </View>
        <SaveButton
          onPress={handleSubmit}
          label={t("activities.editSession.saveSession")}
        />
        <FullScreenLoader
          visible={isLoading}
          message={t("activities.editSession.savingSession")}
        />
      </PageContainer>
    </TouchableWithoutFeedback>
    </View>
  );
}
