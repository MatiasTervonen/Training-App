import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { handleError } from "@/utils/handleError";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editNotes } from "@/api/notes/edit-notes";
import PageContainer from "../PageContainer";
import { notes } from "@/types/models";

type Props = {
  note: notes;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const updated = new Date().toISOString();

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await editNotes({ id: note.id, title, notes, updated_at: updated });

      await onSave?.();
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error editing notes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <PageContainer className="mb-10">
        <AppText className=" text-xl text-center mt-5 mb-10">
          Edit your notes
        </AppText>
        <View className="mb-5">
          <AppInput
            value={title || ""}
            onChangeText={setValue}
            placeholder="Notes title..."
            label="Title..."
          />
        </View>
        <View className="flex-1">
          <NotesInput
            value={notes || ""}
            setValue={setNotes}
            placeholder="Write your notes here..."
            label="Notes..."
          />
        </View>
        <View className="pt-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving notes..." />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
