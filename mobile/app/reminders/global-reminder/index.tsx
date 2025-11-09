import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SaveReminder from "@/api/reminders/save-reminder";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, Info,  } from "lucide-react-native";
import { formatDateTime } from "@/lib/formatDate";

export default function ReminderScreen() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

  const formattedTime = formatDateTime(notifyAt!);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("reminder_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setValue(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading reminder draft",
          route: "reminders/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, []);

  const saveDraft = useDebouncedCallback(async () => {
    if (notes.trim().length === 0 && title.trim().length === 0) {
      await AsyncStorage.removeItem("reminder_draft");
    } else {
      const sessionDraft = {
        title: title,
        notes,
      };
      await AsyncStorage.setItem(
        "reminder_draft",
        JSON.stringify(sessionDraft)
      );
    }
  }, 1000); // Save every second

  useEffect(() => {
    if (!isLoaded) return;
    saveDraft();
  }, [notes, title, saveDraft, isLoaded]);

  const saveReminder = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: "Title is required",
      });
      return;
    }
    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: "Notify time is required",
      });
      return;
    }

    setIsSaving(true);

    try {
      await SaveReminder({
        title: title,
        notes,
        type: "global",
        notify_at: notifyAt ? notifyAt.toISOString() : null,
      });

      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      router.push("/dashboard");
      resetReminder();
    } catch (error) {
      handleError(error, {
        message: "Error saving reminders",
        route: "/api/reminders/save-reminders",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Failed to save reminder. Please try again.",
      });
      setIsSaving(false);
    }
  };

  const resetReminder = () => {
    AsyncStorage.removeItem("reminder_draft");
    setValue("");
    setNotes("");
    setNotifyAt(null);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer>
          <View className="justify-between flex-1">
            <View className="gap-5 mb-10">
              <AppText className="text-xl text-center mt-5">
                Add your reminders here
              </AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  Notifies all logged-in devices.
                </AppText>
              </View>
              <View>
                <AppInput
                  value={title}
                  onChangeText={setValue}
                  placeholder="Title... (required)"
                  label="Title..."
                />
              </View>
              <View className="min-h-[80px]">
                <NotesInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes... (optional)"
                  label="Notes..."
                />
              </View>
              <View>
                <AnimatedButton
                  label={notifyAt ? formattedTime : "Set Notify Time"}
                  onPress={() => setOpen(true)}
                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center"
                >
                  <Plus color="#f3f4f6" />
                </AnimatedButton>
              </View>
              <DatePicker
                date={notifyAt || new Date()}
                onDateChange={setNotifyAt}
                mode="datetime"
                modal
                minimumDate={new Date()}
                open={open}
                onConfirm={(date) => {
                  setOpen(false);
                  setNotifyAt(date);
                }}
                onCancel={() => {
                  setOpen(false);
                }}
              />
            </View>

            <View className="gap-5 mb-10">
              <SaveButton onPress={saveReminder} />
              <DeleteButton onPress={resetReminder} />
            </View>
          </View>
          <FullScreenLoader visible={isSaving} message="Saving reminder..." />
        </PageContainer>
      </TouchableWithoutFeedback>
    </>
  );
}
