import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useEffect, useState } from "react";
import NotesInput from "@/components/NotesInput";
import SaveButton from "@/components/SaveButton";
import DeleteButton from "@/components/DeleteButton";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Session } from "@supabase/supabase-js";
import { saveNote } from "@/api/notes/save-note";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";

export default function NotesScreen() {
  const [title, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const session = useUserStore((state) => state.session);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const loadDraft = await AsyncStorage.getItem("notes_draft");
        if (loadDraft) {
          const draft = JSON.parse(loadDraft);
          setValue(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    };

    loadDraft();
  }, []);

  const saveNotesDraft = useDebouncedCallback(() => {
    if (title.trim().length === 0 && notes.trim().length === 0) {
      AsyncStorage.removeItem("notes_draft");
    }
    const draft = { title, notes };
    AsyncStorage.setItem("notes_draft", JSON.stringify(draft));
  }, 1000);

  useEffect(() => {
    saveNotesDraft();
  }, [notes, title, saveNotesDraft]);

  const handleSaveNotes = async (session: Session) => {
    setIsSaving(true);

    try {
      if (!title.trim() || !notes.trim()) return;

      const result = await saveNote({ title, notes, session });

      if (result === null) {
        throw new Error("Failed to save note");
      }

      if (result === true) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Note saved successfully!",
        });
        setValue("");
        setNotes("");
        await AsyncStorage.removeItem("notes_draft");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save notes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = () => {
    setValue("");
    setNotes("");
    AsyncStorage.removeItem("notes_draft");
  };

  return (
    <ModalPageWrapper leftLabel="Back" rightLabel="Home">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-col flex-1 items-center px-5">
          <View>
            <AppText className="text-2xl text-center my-5">
              Add your notes here
            </AppText>
            <AppInput
              onChangeText={setValue}
              value={title}
              label="Title.."
              placeholder="Notes title..."
            />
          </View>
          <View className="w-full mt-10 flex-1">
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>
          <View className="my-10 w-full flex-col gap-4">
            <SaveButton
              onPress={async () => {
                if (!session) {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: "You must be logged in to save notes.",
                  });
                  return;
                }

                handleSaveNotes(session);
              }}
            />
            <DeleteButton
              onPress={() => {
                handleDeleteNote();
              }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} />
    </ModalPageWrapper>
  );
}
