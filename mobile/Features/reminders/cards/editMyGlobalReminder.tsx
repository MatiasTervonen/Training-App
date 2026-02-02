import { useState } from "react";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { editGlobalReminder } from "@/database/reminders/edit-global-reminder";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime } from "@/lib/formatDate";
import PageContainer from "@/components/PageContainer";
import { full_reminder } from "@/types/session";
import { useTranslation } from "react-i18next";

type Props = {
  reminder: full_reminder;
  onClose: () => void;
  onSave?: () => void;
};

export default function HandleEditGlobalReminder({
  reminder,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation("reminders");
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );
  const [open, setOpen] = useState(false);

  const formattedNotifyAt = formatDateTime(notifyAt!);

  const handleSubmit = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.titleRequired"),
      });
      return;
    }

    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.notifyTimeRequired"),
      });
      return;
    }

    if (notifyAt < new Date()) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.notifyTimeFuture"),
      });
      return;
    }

    const delivered =
      notifyAt && notifyAt.getTime() > Date.now() ? false : reminder.delivered;

    const updated = new Date().toISOString();

    setIsSaving(true);
    try {
      await editGlobalReminder({
        id: reminder.id,
        title,
        notes,
        delivered,
        notify_at: notifyAt ? notifyAt.toISOString() : null,
        updated_at: updated,
        seen_at: null,
      });

      await onSave?.();
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: t("reminders.errors.editGlobalReminder"),
        text2: t("reminders.errors.tryAgainLater"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <PageContainer className="justify-between mb-5">
        <View>
          <AppText className=" text-xl text-center mb-10 mt-5">
            {t("reminders.editReminder")}
          </AppText>
          <View className="mb-5">
            <AppInput
              value={title || ""}
              onChangeText={setValue}
              placeholder={t("reminders.titlePlaceholder")}
              label={t("reminders.titleLabel")}
            />
          </View>
          <SubNotesInput
            value={notes || ""}
            setValue={setNotes}
            className="min-h-[60px]"
            placeholder={t("reminders.notesPlaceholder")}
            label={t("reminders.notesLabel")}
          />
          <View>
            <AnimatedButton
              label={notifyAt ? formattedNotifyAt : t("reminders.setNotifyTime")}
              onPress={() => setOpen(true)}
              className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center mt-10"
              textClassName="text-gray-100"
            >
              <Plus color="#f3f4f6" />
            </AnimatedButton>
          </View>
          <DatePicker
            date={notifyAt ? new Date(notifyAt) : new Date()}
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
        <View className="pt-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message={t("reminders.savingReminder")} />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
