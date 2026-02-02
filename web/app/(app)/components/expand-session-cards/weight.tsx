"use client";

import { formatDate } from "@/app/(app)/lib/formatDate";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { FeedItemUI } from "../../types/session";
import { useTranslation } from "react-i18next";

type weightPayload = {
  weight: number;
  notes: string;
};

export default function WeightSession(weight: FeedItemUI) {
  const { t } = useTranslation("weight");
  const payload = weight.extra_fields as weightPayload;

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <div className="text-center max-w-md mx-auto page-padding">
      <div className="text-sm text-gray-400">
        {formatDate(weight.created_at!)}
      </div>
      <div id="notes-id">
        <div className="my-5 text-xl wrap-break-word">{weight.title}</div>
        <div className="whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          <div className="flex flex-col">
            {payload.notes && <p className="mb-5">{payload.notes}</p>}
            <p className="text-center">
              {payload.weight} {weightUnit}
            </p>
          </div>
        </div>
        <div className="mt-10">
          <LinkButton href="/weight/analytics">{t("weight.analyticsScreen.viewFullHistory")}</LinkButton>
        </div>
      </div>
    </div>
  );
}
