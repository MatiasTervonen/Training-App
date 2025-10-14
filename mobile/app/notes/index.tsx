import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useEffect, useState } from "react";
import NotesInput from "@/components/NotesInput";
import SaveButton from "@/components/SaveButton";
import DeleteButton from "@/components/DeleteButton";
import { saveNote } from "@/api/notes/save-note";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { FeedData, Feed_item } from "@/types/session";
import { generateUUID } from "@/utils/generateUUID";

export default function NotesScreen() {
  const [title, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const queryClient = useQueryClient();

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

  const handleSaveNotes = async () => {
    setIsSaving(true);

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    const optimisticNote: Feed_item = {
      id: generateUUID(),
      title,
      notes,
      created_at: new Date().toISOString(),
      type: "notes",
      pinned: false,
      user_id: "temp-user-id",
    };

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const updatedPages = oldData.pages.map((page, index) => {
        if (index === 0) {
          return { ...page, feed: [optimisticNote, ...page.feed] };
        }
        return page;
      });

      return { ...oldData, pages: updatedPages };
    });

    try {
      if (!title.trim() || !notes.trim()) return;

      const result = await saveNote({ title, notes });

      if (result === null) {
        throw new Error("Failed to save note");
      }

      if (result === true) {
        queryClient.invalidateQueries({ queryKey });
        router.push("/dashboard");
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
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Error saving notes",
        route: "/api/notes/save-note",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save notes. Please try again.",
      });
      setIsSaving(false);
    }
  };

  const handleDeleteNote = () => {
    setValue("");
    setNotes("");
    AsyncStorage.removeItem("notes_draft");
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-col flex-1 items-center px-6">
          <View className="w-full">
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
            <SaveButton onPress={() => handleSaveNotes()} />
            <DeleteButton
              onPress={() => {
                handleDeleteNote();
              }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving your notes..." />
    </>
  );
}
