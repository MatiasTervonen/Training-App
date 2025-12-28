import { useState } from "react";
import SubNotesInput from "../SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editWeight } from "@/database/weight/edit-weight";
import PageContainer from "../PageContainer";
import { FeedItemUI } from "@/types/session";

type Props = {
  weight: FeedItemUI;
  onClose: () => void;
  onSave?: () => void;
};

type weightPayload = {
  notes: string;
  weight: number;
};

export default function EditWeight({ weight, onClose, onSave }: Props) {

  const payload = weight.extra_fields as unknown as weightPayload;

  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(payload.notes);
  const [weightValue, setWeightValue] = useState(
    payload.weight != null ? payload.weight.toString() : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await editWeight({
        id: weight.source_id,
        title,
        notes,
        weight: Number(weightValue),
        updated_at: new Date().toISOString(),
      });

      onSave?.();
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
            className="min-h-[60px]"
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
  );
}
