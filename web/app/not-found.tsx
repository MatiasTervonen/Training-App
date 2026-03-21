"use client";

import LinkButton from "@/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col text-center justify-center min-h-screen max-w-md mx-auto page-padding">
      <h1 className="text-2xl mb-4">{t("notFound.title")}</h1>
      <p className="mb-4">{t("notFound.description")}</p>
      <LinkButton href="/">{t("notFound.goHome")}</LinkButton>
    </div>
  );
}
