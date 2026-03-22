"use client";

import { useTranslation } from "react-i18next";

export default function TypingIndicator() {
  const { t } = useTranslation("chat");

  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="font-body text-xs text-gray-400 ml-1">{t("chat.typing")}</span>
    </div>
  );
}
