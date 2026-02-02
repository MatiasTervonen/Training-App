"use client";

import { NotebookPen, List } from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function Sessions() {
  const { t } = useTranslation("notes");

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">{t("notes.title")}</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/notes/quick-notes">
          <p>{t("notes.quickNotes")}</p>
          <NotebookPen />
        </LinkButton>

        <LinkButton href="/notes/my-notes">
          {t("notes.myNotes")}
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
