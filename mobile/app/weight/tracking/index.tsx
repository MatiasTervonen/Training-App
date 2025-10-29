import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AppInput from "@/components/AppInput";
import { useState, useEffect } from "react";
import NotesInput from "@/components/NotesInput";
import { useRouter } from "expo-router";
import { formatDate } from "@/lib/formatDate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { FeedData, Feed_item } from "@/types/session";
import { generateUUID } from "@/utils/generateUUID";
import { useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/utils/handleError";
import Toast from "react-native-toast-message";
import { saveWeight } from "@/api/weight/save-weight";
import PageContainer from "@/components/PageContainer";

export default function SettingsScreen() {
  const now = formatDate(new Date());

  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState(`Weight - ${now}`);
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("weight_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || `Weight - ${now}`);
          setNotes(draft.notes || "");
          setWeight(draft.weight || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading weight draft",
          route: "weight/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, [now]);

  const saveWeightDraft = useDebouncedCallback(async () => {
    if (title.trim().length === 0 && notes.trim().length === 0) {
      await AsyncStorage.removeItem("weight_draft");
    } else {
      const draft = { title, notes, weight };
      await AsyncStorage.setItem("weight_draft", JSON.stringify(draft));
    }
  }, 1000);

  useEffect(() => {
    if (!isLoaded) return;
    saveWeightDraft();
  }, [notes, title, weight, saveWeightDraft, isLoaded]);

  const handleDelete = async () => {
    await AsyncStorage.removeItem("weight_draft");
    setTitle("");
    setNotes("");
    setWeight("");
  };

  const handleSaveWeight = async () => {
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Title",
        text2: "Please enter a title for your weight entry.",
      });
      return;
    }

    if (!weight.trim() || isNaN(Number(weight))) {
      Toast.show({
        type: "error",
        text1: "Invalid Weight",
        text2: "Please enter a valid numeric weight.",
      });
      return;
    }

    setIsSaving(true);

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    const optimisticWeight: Feed_item = {
      id: generateUUID(),
      title,
      weight: weight ? Number(weight) : undefined,
      created_at: new Date().toISOString(),
      type: "weight",
      pinned: false,
      user_id: "temp-user-id",
    };

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const updatedPages = oldData.pages.map((page, index) => {
        if (index === 0) {
          return { ...page, feed: [optimisticWeight, ...page.feed] };
        }
        return page;
      });

      return { ...oldData, pages: updatedPages };
    });

    try {
      if (!title.trim() || !weight.trim()) return;

      const result = await saveWeight({ title, notes, weight: Number(weight) });

      if (result === null) {
        throw new Error("Failed to save weight");
      }

      if (result === true) {
        router.push("/dashboard");
        queryClient.refetchQueries({ queryKey: ["weightData"], exact: true });
        queryClient.invalidateQueries({ queryKey });
        await AsyncStorage.removeItem("weight_draft");
        setTitle("");
        setNotes("");
        setWeight("");
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Weight saved successfully!",
          });
        }, 500);
      }
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Error saving weights",
        route: "/api/weights/save-weight",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save weights. Please try again.",
      });
      setIsSaving(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="flex-col justify-between pb-10">
          <View className="gap-5">
            <AppText className="text-2xl text-center my-5">
              Weight Tracker
            </AppText>
            <AppInput
              value={title}
              onChangeText={setTitle}
              label="Title for Weight..."
              placeholder="Weight entry title..."
            />
            <View className="min-h-[80px]">
              <NotesInput
                value={notes}
                onChangeText={setNotes}
                label="Enter your notes here..."
                placeholder="Enter your notes here...(optional)"
              />
            </View>
            <AppInput
              value={weight}
              onChangeText={setWeight}
              label="Enter your weight..."
              placeholder="Enter your weight here..."
              keyboardType="numeric"
            />
          </View>

          <View className="gap-5">
            <SaveButton onPress={handleSaveWeight} />
            <DeleteButton onPress={handleDelete} />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving weight..." />
    </>
  );
}
