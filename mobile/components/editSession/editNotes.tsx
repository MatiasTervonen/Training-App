import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editNotes } from "@/api/notes/edit-notes";
import PageContainer from "../PageContainer";
import { notes } from "@/types/models";
import { Dot } from "lucide-react-native";

type Props = {
  note: notes;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [originalData] = useState(note);
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const currentData = {
    ...originalData,
    title,
    notes,
  };

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

  const hasChanges =
    JSON.stringify(originalData) !== JSON.stringify(currentData);

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50  py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {hasChanges ? "unsaved changes" : ""}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <PageContainer className="mb-5">
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
            <SaveButton
              disabled={!hasChanges}
              onPress={handleSubmit}
              label={!hasChanges ? "Save" : "Save Changes"}
            />
          </View>
          <FullScreenLoader visible={isSaving} message="Saving notes..." />
        </PageContainer>
      </TouchableWithoutFeedback>
    </View>
  );
}
