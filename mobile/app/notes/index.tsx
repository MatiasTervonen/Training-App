import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import useSaveDraft from "@/hooks/notes/useSaveDraft";
import useSaveNotes from "@/hooks/notes/useSaveNotes";

export default function NotesScreen() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resetNote = () => {
    setTitle("");
    setNotes("");
    AsyncStorage.removeItem("notes_draft");
  };

  // useSaveDraft hook to save draft notes
  useSaveDraft({
    title,
    notes,
    setTitle,
    setNotes,
    setIsLoaded,
    isLoaded,
  });

  // useSaveNotes hook to save notes
  const { handleSaveNotes } = useSaveNotes({
    title,
    notes,
    setIsSaving,
    resetNote,
  });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="justify-between">
          <View>
            <AppText className="text-2xl text-center mb-10">
              Add your notes here
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title}
                setValue={setTitle}
                label="Title.."
                placeholder="Notes title...(optional)"
              />
            </View>
            <NotesInput
              className="min-h-[120px]"
              value={notes}
              setValue={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>

          <View className="mt-10 flex-col gap-4">
            <SaveButton onPress={handleSaveNotes} />
            <DeleteButton onPress={resetNote} />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving your notes..." />
    </ScrollView>
  );
}
