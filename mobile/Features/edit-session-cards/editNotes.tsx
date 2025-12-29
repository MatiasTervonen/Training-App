import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "../../components/AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editNotes } from "@/database/notes/edit-notes";
import PageContainer from "../../components/PageContainer";

import { Dot } from "lucide-react-native";
import { FeedItemUI } from "@/types/session";

type Props = {
  note: FeedItemUI;
  onClose: () => void;
  onSave?: (updateFeedItem: FeedItemUI) => void;
};

type notesPayload = {
  notes: string;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const payload = note.extra_fields as unknown as notesPayload;

  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(payload.notes);
  const [isSaving, setIsSaving] = useState(false);

  const initialTitle = note.title || "";
  const initialNotes = payload.notes || "";

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const updatedFeedItem = await editNotes({
        id: note.source_id,
        title,
        notes,
        updated_at: new Date().toISOString(),
      });

      await onSave?.(updatedFeedItem as FeedItemUI);
      onClose();
    } catch (error) {
      console.log("error editing notes", error);
      Toast.show({
        type: "error",
        text1: "Error editing notes",
        text2: "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = title !== initialTitle || notes !== initialNotes;

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
              className="min-h-[120px]"
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
