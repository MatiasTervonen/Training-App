"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import CustomInput from "@/ui/CustomInput";
import TiptapEditor from "@/features/notes/components/TiptapEditor";
import type { UploadedImage } from "@/features/notes/components/TiptapEditor";
import SaveButtonSpinner from "@/components/buttons/save-button-spinner";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/components/FullScreenLoader";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import useSaveFeedbackDraft from "@/features/menu/hooks/useSaveFeedbackDraft";
import { sendFeedback } from "@/database/settings/send-feedback";
import { createClient } from "@/utils/supabase/client";

export default function FeedbackPage() {
  const { t } = useTranslation("menu");
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { clearDraft } = useSaveFeedbackDraft({
    category,
    title,
    message,
    setCategory,
    setTitle,
    setMessage,
    setIsLoaded,
    isLoaded,
  });

  const categoryOptions = [
    { value: "bug", label: t("feedback.categories.bug") },
    { value: "feature", label: t("feedback.categories.feature") },
    { value: "general", label: t("feedback.categories.general") },
  ];

  const resetForm = useCallback(async () => {
    if (uploadedImages.length > 0) {
      const supabase = createClient();
      const paths = uploadedImages.map((img) => img.storage_path);
      await supabase.storage.from("notes-images").remove(paths);
    }
    clearDraft();
    setCategory("general");
    setTitle("");
    setMessage("");
    setUploadedImages([]);
  }, [uploadedImages, clearDraft]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t("feedback.emptyTitle"));
      return;
    }
    if (!message.replace(/<[^>]*>/g, "").trim()) {
      toast.error(t("feedback.emptyMessage"));
      return;
    }

    setIsSending(true);
    try {
      await sendFeedback({
        category: category as "bug" | "feature" | "general",
        title: title.trim(),
        message: message.trim(),
        imagePaths: uploadedImages.map((img) => img.storage_path),
      });
      toast.success(t("feedback.sendSuccess"));
      setUploadedImages([]);
      clearDraft();
      setCategory("general");
      setTitle("");
      setMessage("");
    } catch {
      toast.error(t("feedback.sendError"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-padding max-w-3xl mx-auto h-full flex flex-col pb-10">
      <div className="flex flex-col grow min-h-0">
        <h1 className="text-2xl text-center mb-10">{t("feedback.title")}</h1>
        <div className="flex flex-col gap-5 grow min-h-0">
          <ExerciseTypeSelect
            value={category}
            onChange={setCategory}
            label={t("feedback.category")}
            options={categoryOptions}
          />
          <CustomInput
            label={t("feedback.titleLabel")}
            placeholder={t("feedback.titlePlaceholder")}
            value={title}
            setValue={setTitle}
          />
          <TiptapEditor
            content={message}
            onChange={setMessage}
            onImagesChange={setUploadedImages}
            placeholder={t("feedback.messagePlaceholder")}
            label={t("feedback.messageLabel")}
          />
        </div>
      </div>
      <div className="flex items-center gap-5 mt-10">
        <DeleteSessionBtn onDelete={resetForm} />
        <SaveButtonSpinner
          onClick={handleSubmit}
          label={t("feedback.send")}
          loading={isSending}
          disabled={isSending}
        />
      </div>
      {isSending && <FullScreenLoader message={t("feedback.sending")} />}
    </div>
  );
}
