import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import SelectInput from "@/components/Selectinput";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import PageContainer from "@/components/PageContainer";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { sendFeedback } from "@/database/settings/send-feedback";
import { useConfirmAction } from "@/lib/confirmAction";
import NotesInput from "@/components/NotesInput";
import useSaveDraft from "@/features/feedback/hooks/useSaveDraft";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FeedbackScreen() {
  const { t } = useTranslation("menu");

  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { clearDraft } = useSaveDraft({
    category,
    title,
    message,
    setCategory,
    setTitle,
    setMessage,
  });

  const categoryOptions = [
    { value: "bug", label: t("menu:feedback.categories.bug") },
    { value: "feature", label: t("menu:feedback.categories.feature") },
    { value: "general", label: t("menu:feedback.categories.general") },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: t("menu:feedback.emptyTitle"),
      });
      return;
    }

    if (!message.trim()) {
      Toast.show({
        type: "error",
        text1: t("menu:feedback.emptyMessage"),
      });
      return;
    }

    setIsSending(true);
    try {
      await sendFeedback({ category, title, message });
      Toast.show({
        type: "success",
        text1: t("menu:feedback.sendSuccess"),
      });
      setCategory("general");
      setTitle("");
      setMessage("");
      await clearDraft();
    } catch {
      Toast.show({
        type: "error",
        text1: t("menu:feedback.sendError"),
      });
    } finally {
      setIsSending(false);
    }
  };

  const confirmAction = useConfirmAction();

  const handleDelete = async () => {
    const confirmed = await confirmAction({});
    if (!confirmed) return;

    setCategory("general");
    setTitle("");
    setMessage("");
    await AsyncStorage.removeItem("feedback_draft");
  };

  return (
    <ModalPageWrapper>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="justify-between">
          <View>
            <AppText className="text-2xl text-center mb-10">
              {t("menu:feedback.title")}
            </AppText>
            <View className="mb-4">
              <SelectInput
                topLabel={t("menu:feedback.category")}
                label={t("menu:feedback.category")}
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
            </View>
            <View className="mb-4">
              <AppInput
                value={title}
                setValue={setTitle}
                label={t("menu:feedback.titleLabel")}
                placeholder={t("menu:feedback.titlePlaceholder")}
              />
            </View>
            <View>
              <NotesInput
                value={message}
                setValue={setMessage}
                label={t("menu:feedback.messageLabel")}
                placeholder={t("menu:feedback.messagePlaceholder")}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <AnimatedButton
              onPress={handleDelete}
              className="btn-danger py-3"
              label={t("common:common.delete")}
              textClassName="text-center text-gray-100"
              tabClassName="flex-1"
            />
            <AnimatedButton
              onPress={handleSubmit}
              className="btn-base py-3"
              label={t("menu:feedback.send")}
              textClassName="text-center text-gray-100"
              tabClassName="flex-1"
            />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader
        visible={isSending}
        message={t("menu:feedback.sending")}
      />
    </ModalPageWrapper>
  );
}
