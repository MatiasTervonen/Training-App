import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { Feed_item } from "@/types/session";
import { handleError } from "@/utils/handleError";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editNotes } from "@/api/notes/edit-notes";

type Props = {
  note: Feed_item;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await editNotes({ id: note.id, title, notes });

      await onSave?.();
      onClose();
    } catch (error) {
      handleError(error, {
        message: "Error editing notes",
        route: "/api/notes/edit-notes",
        method: "POST",
      });
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
      <View className="w-full flex-1 px-6 my-10 ">
        <AppText className=" text-xl text-center my-5">Edit your notes</AppText>
        <View className="mb-10">
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
            onChangeText={setNotes}
            placeholder="Write your notes here..."
            label="Notes..."
          />
        </View>
        <View className="py-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving notes..." />
      </View>
    </TouchableWithoutFeedback>
  );
}
