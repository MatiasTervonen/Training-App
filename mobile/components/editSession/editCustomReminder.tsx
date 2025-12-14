import { useState } from "react";
import SubNotesInput from "../SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "../AppText";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime, formatTime } from "@/lib/formatDate";
import PageContainer from "../PageContainer";
import EditCustomReminderData from "@/database/reminders/edit -custom-reminder";
import { Checkbox } from "expo-checkbox";
import { full_reminder } from "@/types/session";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";

type Props = {
  reminder: full_reminder;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditCustomReminder({
  reminder,
  onClose,
  onSave,
}: Props) {
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date>(() => {
    if (reminder.notify_date) {
      return new Date(reminder.notify_date);
    }

    if (reminder.notify_at_time) {
      const base = new Date();
      const [h, m, s] = reminder.notify_at_time.split(":").map(Number);
      base.setHours(h, m, s || 0, 0);
      return base;
    }

    return new Date();
  });
  const [open, setOpen] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>(reminder.weekdays || []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formattedNotifyAt =
    reminder.type === "one-time"
      ? formatDateTime(notifyAt!)
      : formatTime(notifyAt!);

  const handleSubmit = async () => {
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

    if (reminder.type === "one-time" && notifyAt < new Date()) {
      Toast.show({
        type: "error",
        text1: "Notify time must be in the future.",
      });
      return;
    }

    const delivered =
      reminder.type === "one-time"
        ? notifyAt?.toISOString() === reminder.notify_date
          ? reminder.delivered
          : false
        : false;

    const updated = new Date().toISOString();

    setIsSaving(true);
    try {
      // Cancel old notifications
      const oldNotificationIds = Array.isArray(reminder.notification_id)
        ? reminder.notification_id
        : typeof reminder.notification_id === "string"
          ? [reminder.notification_id]
          : [];

      for (const nid of oldNotificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(nid);
        } catch (error) {
          console.log("Error canceling notification:", error);
        }
      }

      // Schedule new notifications with reminderId
      const newNotificationIds = await scheduleNotifications();

      await EditCustomReminderData({
        id: reminder.id,
        title,
        notes,
        delivered,
        notify_at_time:
          reminder.type === "weekly" || reminder.type === "daily"
            ? notifyAt
              ? notifyAt.toTimeString().slice(0, 8)
              : null
            : null,
        notify_date:
          reminder.type === "one-time" ? (notifyAt ? notifyAt : null) : null,
        weekdays,
        type: reminder.type as "weekly" | "daily" | "one-time",
        notification_id: newNotificationIds || [],
        updated_at: updated,
      });

      await onSave?.();
      onClose();
      Toast.show({
        type: "success",
        text1: "Reminder updated successfully",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error updating reminder, Try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleNotifications = async () => {
    try {
      if (reminder.type === "one-time") {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: notes || "",
            sound: true,
            data: { reminderId: reminder.id },
          },
          trigger: { type: "date", date: notifyAt } as any,
        });
        return id;
      } else if (reminder.type === "daily") {
        const hour = notifyAt.getHours();
        const minute = notifyAt.getMinutes();

        const trigger: any =
          Platform.OS === "android"
            ? {
                type: "daily",
                hour,
                minute,
                repeat: true,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour,
                minute,
                repeats: true,
              };

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: notes || "",
            sound: true,
            data: { reminderId: reminder.id },
          },
          trigger,
        });
        return id;
      } else if (reminder.type === "weekly") {
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

            return Notifications.scheduleNotificationAsync({
              content: {
                title: title,
                body: notes || "",
                sound: true,
                data: { reminderId: reminder.id },
              },
              trigger,
            });
          }),
        );
        return notifications;
      }
    } catch (error) {
      console.log("Error scheduling notifications:", error);
      handleError(error, {
        message: "Error scheduling notifications",
        route: "/components/editSession/editCustomReminder",
        method: "scheduleNotifications",
      });
      throw error;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <PageContainer className="justify-between mb-5">
        <View>
          <AppText className=" text-xl text-center mb-10 mt-5">
            Edit your reminder
          </AppText>
          <View className="mb-5">
            <AppInput
              value={title || ""}
              onChangeText={setValue}
              placeholder="Reminder title..."
              label="Title..."
            />
          </View>
          <SubNotesInput
            value={notes || ""}
            setValue={setNotes}
            className="min-h-[60px]"
            placeholder="Notes... (optional)"
            label="Notes..."
          />
          <View>
            <AnimatedButton
              label={notifyAt ? formattedNotifyAt : "Set Notify Time"}
              onPress={() => setOpen(true)}
              className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center mt-10"
              textClassName="text-gray-100"
            >
              <Plus color="#f3f4f6" />
            </AnimatedButton>
          </View>
          <DatePicker
            date={notifyAt}
            onDateChange={setNotifyAt}
            mode={reminder.type === "one-time" ? "datetime" : "time"}
            modal
            minimumDate={reminder.type === "one-time" ? new Date() : undefined}
            open={open}
            onConfirm={(date) => {
              setOpen(false);
              setNotifyAt(date);
            }}
            onCancel={() => {
              setOpen(false);
            }}
          />
          {reminder.type === "weekly" && (
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
                              weekdays.filter((day) => day !== dayNumber),
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
          )}
        </View>
        <View className="pt-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving reminder..." />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
