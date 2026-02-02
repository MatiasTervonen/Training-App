"use client";

import { formatDate } from "@/app/(app)/lib/formatDate";
import CopyButton from "../buttons/CopyButton";
import { FeedItemUI } from "../../types/session";
import { useTranslation } from "react-i18next";

type notesPayload = {
  notes: string;
};

export default function NotesSession(notes: FeedItemUI) {
  const { t } = useTranslation("common");
  const payload = notes.extra_fields as notesPayload;

  return (
    <div className="text-center max-w-lg mx-auto page-padding">
      <div className="flex flex-col gap-2 text-sm text-gray-400">
        <p>{t("common.created")} {formatDate(notes.created_at)}</p>
        {notes.updated_at && (
          <p className="text-yellow-500">
            {t("common.updated")} {formatDate(notes.updated_at)}
          </p>
        )}
      </div>
      <div
        id="notes-id"
        className="bg-slate-900 px-5 pt-5 pb-10 rounded-md shadow-md mt-5"
      >
        <div className="text-xl text-center mb-10 border-b border-gray-700 pb-2 wrap-break-word">
          {notes.title}
        </div>
        <div className="whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full text-left text-lg">
          {payload.notes}
        </div>
      </div>
      <CopyButton targetId="notes-id" />
    </div>
  );
}
