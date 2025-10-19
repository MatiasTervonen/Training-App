import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { Feed_item } from "@/types/session";
import { handleError } from "@/utils/handleError";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editWeight } from "@/api/weight/edit-weight";

type Props = {
  weight: Feed_item;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditWeight({ weight, onClose, onSave }: Props) {
  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(weight.notes);
  const [weightValue, setWeightValue] = useState(
    weight.weight != null ? weight.weight.toString() : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await editWeight({
        id: weight.id,
        title,
        notes,
        weight: Number(weightValue),
      });

      onSave?.();
      onClose();
    } catch (error) {
      handleError(error, {
        message: "Error editing weight session",
        route: "/api/weight/edit-weight",
        method: "POST",
      });
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
      <View className="w-full flex-1 px-6 my-10 justify-between">
        <View className="gap-5">
          <AppText className="text-xl text-center my-5">
            Edit your weight session
          </AppText>
          <AppInput
            value={title || ""}
            onChangeText={setValue}
            placeholder="Weight title..."
            label="Title..."
          />
          <View className="min-h-[80px]">
            <NotesInput
              value={notes || ""}
              onChangeText={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>
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
        <View className="w-full py-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving weight..." />
      </View>
    </TouchableWithoutFeedback>
  );
}
