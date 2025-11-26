import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import AppText from "@/components/AppText";
import SaveCustomReminder from "@/api/reminders/save-custom-reminder";
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
import { Plus, Info } from "lucide-react-native";
import { formatTime } from "@/lib/formatDate";
import * as Notifications from "expo-notifications";
import { Checkbox } from "expo-checkbox";

export default function ReminderScreen() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const router = useRouter();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const queryClient = useQueryClient();

  const formattedTime = formatTime(notifyAt!);

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

    const notificationIds = await setNotification();

    try {
      await SaveCustomReminder({
        title: title,
        notes,
        weekdays,
        notify_at_time: notifyAt.toISOString().split("T")[1].split("Z")[0],
        type: "weekly",
        notify_date: null,
        notification_id: notificationIds ?? [],
      });

      queryClient.refetchQueries({ queryKey: ["get-reminders"], exact: true });
      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      router.push("/dashboard");
      resetReminder();
    } catch {
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
    setWeekdays([]);
  };

  async function setNotification() {
    if (!notifyAt || weekdays.length === 0) return;

    try {
      const hour = notifyAt.getHours();
      const minute = notifyAt.getMinutes();

      const notifications = await Promise.all(
        weekdays.map((day) => {
          const trigger: any =
            Platform.OS === "android"
              ? {
                  type: "weekly",
                  weekday: day,
                  hour,
                  minute,
                }
              : {
                  type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                  weekday: day,
                  hour,
                  minute,
                };

          const id = Notifications.scheduleNotificationAsync({
            content: {
              title: title,
              body: notes,
              sound: true,
            },
            trigger,
          });

          return id;
        })
      );

      return notifications;
    } catch (error) {
      console.log("Error scheduling notifications:", error);
      handleError(error, {
        message: "Error scheduling notifications",
        route: "/api/reminders/schedule-notifications",
        method: "POST",
      });
    }
  }

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer>
          <View className="justify-between flex-1">
            <View className="gap-5 mb-10">
              <AppText className="text-xl text-center mt-5">
                Weekly reminders
              </AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  Repeats on selected days each week.
                </AppText>
              </View>
              <View>
                <AppInput
                  value={title}
                  setValue={setValue}
                  placeholder="Title... (required)"
                  label="Title..."
                />
              </View>
              <View className="min-h-[80px]">
                <NotesInput
                  value={notes}
                  setValue={setNotes}
                  placeholder="Notes... (optional)"
                  label="Notes..."
                />
              </View>
              <View>
                <AnimatedButton
                  label={notifyAt ? formattedTime : "Set Notify Time"}
                  onPress={() => setOpen(true)}
                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center"
                  textClassName="text-gray-100"
                >
                  <Plus color="#f3f4f6" />
                </AnimatedButton>
              </View>
              <DatePicker
                date={notifyAt || new Date()}
                onDateChange={setNotifyAt}
                mode="time"
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

              <View className="mt-5">
                <View className="flex-row gap-6">
                  <AppText>Repeat on these days:</AppText>
                </View>
                <View className="flex-row justify-between mt-3 px-4">
                  {days.map((day, index) => {
                    const dayNumber = index + 1; // Expo weekdays: 1 = Sunday, 7 = Saturday
                    const isChecked = weekdays.includes(dayNumber);

                    return (
                      <View key={day} className="items-center mt-2">
                        <Checkbox
                          hitSlop={10}
                          value={isChecked}
                          onValueChange={(newValue) => {
                            if (newValue) {
                              setWeekdays([...weekdays, dayNumber]);
                            } else {
                              setWeekdays(
                                weekdays.filter((day) => day !== dayNumber)
                              );
                            }
                          }}
                        />
                        <AppText className="mt-2">{day}</AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
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
