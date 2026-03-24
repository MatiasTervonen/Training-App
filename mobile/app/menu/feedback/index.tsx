import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppInput from "@/components/AppInput";
import SelectInput from "@/components/Selectinput";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import PageContainer from "@/components/PageContainer";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { sendFeedback } from "@/database/settings/send-feedback";
import { useConfirmAction } from "@/lib/confirmAction";
import NotesInput from "@/components/NotesInput";
import useSaveDraft from "@/features/feedback/hooks/useSaveDraft";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImagePicker from "@/features/notes/components/ImagePicker";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

const MAX_IMAGES = 3;

export default function FeedbackScreen() {
  const { t } = useTranslation("menu");

  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1);

  const { clearDraft } = useSaveDraft({
    category,
    title,
    message,
    imageUris,
    setCategory,
    setTitle,
    setMessage,
    setImageUris,
  });

  const confirmAction = useConfirmAction();

  const categoryOptions = [
    { value: "bug", label: t("menu:feedback.categories.bug") },
    { value: "feature", label: t("menu:feedback.categories.feature") },
    { value: "general", label: t("menu:feedback.categories.general") },
  ];

  const handleImageSelected = (uri: string) => {
    if (imageUris.length >= MAX_IMAGES) {
      Toast.show({
        type: "error",
        text1: t("menu:feedback.maxImages", { count: MAX_IMAGES }),
      });
      return;
    }
    setImageUris((prev) => [...prev, uri]);
  };

  const handleDeleteImage = async (uri: string) => {
    const confirmed = await confirmAction({
      title: t("notes:notes.images.deleteImageTitle"),
      message: t("notes:notes.images.deleteImageMessage"),
    });
    if (!confirmed) return;
    setImageUris((prev) => prev.filter((u) => u !== uri));
  };

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
      await sendFeedback({ category, title, message, imageUris });
      Toast.show({
        type: "success",
        text1: t("menu:feedback.sendSuccess"),
      });
      setCategory("general");
      setTitle("");
      setMessage("");
      setImageUris([]);
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

  const handleDelete = async () => {
    const confirmed = await confirmAction({});
    if (!confirmed) return;

    setCategory("general");
    setTitle("");
    setMessage("");
    setImageUris([]);
    await AsyncStorage.removeItem("feedback_draft");
  };

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bottomOffset={50}>
        <PageContainer className="justify-between">
          <View>
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
            <View className="mb-4">
              <NotesInput
                value={message}
                setValue={setMessage}
                label={t("menu:feedback.messageLabel")}
                placeholder={t("menu:feedback.messagePlaceholder")}
                autoGrow
              />
            </View>
            <View className="mb-4">
              {imageUris.map((uri, index) => (
                <DraftImageItem
                  key={uri}
                  uri={uri}
                  onPress={() => setViewerIndex(index)}
                  onDelete={() => handleDeleteImage(uri)}
                />
              ))}
              {imageUris.length < MAX_IMAGES && (
                <ImagePicker onImageSelected={handleImageSelected} />
              )}
            </View>
          </View>
          <View className="flex-row gap-3 pt-3">
            <AnimatedButton
              onPress={handleDelete}
              className="flex-1 btn-danger py-3"
              label={t("common:common.delete")}
            />
            <AnimatedButton
              onPress={handleSubmit}
              className="flex-1 btn-base py-3"
              label={t("menu:feedback.send")}
            />
          </View>
        </PageContainer>
      </KeyboardAwareScrollView>
      <FullScreenLoader
        visible={isSending}
        message={t("menu:feedback.sending")}
      />
      {imageUris.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={imageUris.map((uri, i) => ({ id: String(i), uri }))}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </View>
  );
}
