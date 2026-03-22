"use client";

import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

export default function ChatEmptyState() {
  const { t } = useTranslation("chat");

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
        <MessageCircle size={36} className="text-slate-400" />
      </div>
      <p className="text-xl mb-2">{t("chat.selectConversation")}</p>
      <p className="text-sm text-gray-400">{t("chat.orStartNew")}</p>
    </div>
  );
}
