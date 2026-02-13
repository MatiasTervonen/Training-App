"use client";

import { formatDate } from "@/lib/formatDate";
import CopyButton from "@/components/buttons/CopyButton";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";
import { ensureHtml } from "@/features/notes/lib/ensureHtml";

type notesPayload = {
  notes: string;
};

export default function NotesSession(notes: FeedItemUI) {
  const { t } = useTranslation("common");
  const payload = notes.extra_fields as notesPayload;

  return (
    <div className="text-center max-w-3xl mx-auto page-padding">
      <div className="flex flex-col gap-2 text-sm text-gray-400">
        <p>
          {t("common.created")} {formatDate(notes.created_at)}
        </p>
        {notes.updated_at && (
          <p className="text-yellow-500">
            {t("common.updated")} {formatDate(notes.updated_at)}
          </p>
        )}
      </div>
      <div
        id="notes-id"
        className="relative bg-slate-900 px-5 pt-5 pb-10 rounded-md shadow-md mt-5"
      >
        <div className="absolute top-2 right-2">
          <CopyButton targetId="notes-id" />
        </div>
        <div className="text-xl text-center mb-10 border-b border-gray-700 pb-2 wrap-break-words">
          {notes.title}
        </div>
        <div
          className="prose prose-invert max-w-none text-left font-body"
          dangerouslySetInnerHTML={{ __html: ensureHtml(payload.notes) }}
        />
      </div>
    </div>
  );
}
