"use client";

import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function WeightPage() {
  const { t } = useTranslation("weight");

  return (
    <div className="pt-5 px-5 pb-10 max-w-md mx-auto">
      <h1 className="text-2xl mb-10 text-center">{t("weight.title")}</h1>
      <div className="flex flex-col gap-4">
        <LinkButton href={"/weight/tracking"}>{t("weight.tracking")}</LinkButton>
        <LinkButton href={"/weight/analytics"}>{t("weight.analytics")}</LinkButton>
      </div>
    </div>
  );
}
