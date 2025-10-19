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
      const result = await saveNote({ title, notes });

      if (result === null) {
        throw new Error("Failed to save note");
      }

      if (result === true) {
        router.push("/dashboard");
        queryClient.invalidateQueries({ queryKey });
        setValue("");
        setNotes("");
        await AsyncStorage.removeItem("notes_draft");
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Note saved successfully!",
          });
        }, 500);
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
        <View className="flex-col flex-1 px-6 w-full max-w-lg mx-auto justify-between">
          <View className="">
            <AppText className="text-2xl text-center my-5">
              Add your notes here
            </AppText>
            <AppInput
              onChangeText={setValue}
              value={title}
              label="Title.."
              placeholder="Notes title...(optional)"
            />
          </View>
          <View className="flex-1 mt-10">
            <NotesInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>
          <View className="my-10 flex-col gap-4">
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
