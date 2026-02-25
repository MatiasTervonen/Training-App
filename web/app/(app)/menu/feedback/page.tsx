"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import CustomInput from "@/ui/CustomInput";
import TiptapEditor from "@/features/notes/components/TiptapEditor";
import SaveButtonSpinner from "@/components/buttons/save-button-spinner";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/components/FullScreenLoader";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import useSaveFeedbackDraft from "@/features/menu/hooks/useSaveFeedbackDraft";
import { sendFeedback } from "@/database/settings/send-feedback";

export default function FeedbackPage() {
  const { t } = useTranslation("menu");
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
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

  const resetForm = () => {
    clearDraft();
    setCategory("general");
    setTitle("");
    setMessage("");
  };

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
      });
      toast.success(t("feedback.sendSuccess"));
      resetForm();
    } catch {
      toast.error(t("feedback.sendError"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-padding max-w-3xl mx-auto min-h-full flex flex-col justify-between pb-10">
      <div>
        <h1 className="text-2xl text-center mb-10">{t("feedback.title")}</h1>
        <div className="flex flex-col gap-5">
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
