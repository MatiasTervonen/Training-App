import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useEffect, useState } from "react";
import NotesInput from "@/components/NotesInput";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import { saveNote } from "@/api/notes/save-note";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";

export default function NotesScreen() {
  const [title, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("notes_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setValue(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading notes draft",
          route: "notes/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, []);

  const saveNotesDraft = useDebouncedCallback(async () => {
    if (title.trim().length === 0 && notes.trim().length === 0) {
      await AsyncStorage.removeItem("notes_draft");
    } else {
      const draft = { title, notes };
      await AsyncStorage.setItem("notes_draft", JSON.stringify(draft));
    }
  }, 1000);

  useEffect(() => {
    if (!isLoaded) return;
    saveNotesDraft();
  }, [notes, title, saveNotesDraft, isLoaded]);

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Notes cannot be empty.",
      });
      return;
    }
    setIsSaving(true);

    try {
      await saveNote({ title, notes });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      resetNote();
      router.push("/dashboard");
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Note saved successfully!",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save notes. Please try again.",
      });
      setIsSaving(false);
    }
  };

  const resetNote = () => {
    setValue("");
    setNotes("");
    AsyncStorage.removeItem("notes_draft");
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="flex-col justify-between">
          <View>
            <AppText className="text-2xl text-center mb-10">
              Add your notes here
            </AppText>
            <AppInput
              value={title}
              setValue={setValue}
              label="Title.."
              placeholder="Notes title...(optional)"
            />
          </View>
          <View className="flex-1 mt-5">
            <NotesInput
              value={notes}
              setValue={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>
          <View className="mt-10 flex-col gap-4">
            <SaveButton onPress={() => handleSaveNotes()} />
            <DeleteButton
              onPress={() => {
                resetNote();
              }}
            />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving your notes..." />
    </>
  );
}
