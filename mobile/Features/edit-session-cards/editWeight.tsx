import { useState, useEffect } from "react";
import SubNotesInput from "../../components/SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "../../components/AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editWeight } from "@/database/weight/edit-weight";
import PageContainer from "../../components/PageContainer";
import { FeedItemUI } from "@/types/session";
import { Dot } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type Props = {
  weight: FeedItemUI;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type weightPayload = {
  notes: string;
  weight: number;
};

export default function EditWeight({ weight, onClose, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("common");
  const payload = weight.extra_fields as weightPayload;

  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(payload.notes);
  const [weightValue, setWeightValue] = useState(
    payload.weight != null ? payload.weight.toString() : "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    title !== weight.title ||
    notes !== payload.notes ||
    weightValue !== (payload.weight != null ? payload.weight.toString() : "");

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const updatedFeedItem = await editWeight({
        id: weight.source_id,
        title,
        notes,
        weight: Number(weightValue),
        updated_at: new Date().toISOString(),
      });

      onSave({ ...updatedFeedItem, feed_context: weight.feed_context });
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to update weight session",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">{t("common.unsavedChanges")}</AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <PageContainer className="justify-between mb-10 mt-5">
          <View className="gap-5">
          <AppText className="text-xl text-center mb-5">
            Edit your weight session
          </AppText>
          <AppInput
            value={title || ""}
            onChangeText={setValue}
            placeholder="Weight title..."
            label="Title..."
          />
          <SubNotesInput
            value={notes || ""}
            setValue={setNotes}
            placeholder="Notes... (optional)"
            label="Notes..."
          />
          <AppInput
            value={weightValue}
            onChangeText={(val) => {
              const numbersOnly = val.replace(/[^0-9.]/g, "");
              setWeightValue(numbersOnly);
            }}
            placeholder="Enter your weight..."
            label="Weight..."
          />
        </View>
        <SaveButton onPress={handleSubmit} />
        <FullScreenLoader visible={isSaving} message="Saving weight..." />
      </PageContainer>
    </TouchableWithoutFeedback>
    </View>
  );
}
