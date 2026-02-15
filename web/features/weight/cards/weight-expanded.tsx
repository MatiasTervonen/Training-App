"use client";

import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import LinkButton from "@/components/buttons/LinkButton";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";
import { ChartNoAxesCombined } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "@/database/weight/get-weight";
import WeightFeedChart from "@/features/weight/components/WeightFeedChart";
import Spinner from "@/components/spinner";

type weightPayload = {
  weight: number;
  notes: string;
};

export default function WeightSession(weight: FeedItemUI) {
  const { t } = useTranslation("weight");
  const payload = weight.extra_fields as weightPayload;

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const {
    data: weightData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["get-weight"],
    queryFn: getWeight,
  });

  return (
    <div className="text-center max-w-md mx-auto page-padding">
      <div className="text-sm text-gray-400">
        {t("weight.created")}: {formatDate(weight.created_at!)}
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

        {isLoading ? (
          <div className="mt-5 bg-slate-900 shadow-md rounded-md p-4 h-[340px]">
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          </div>
        ) : error ? (
          <div className="mt-5 bg-slate-900 shadow-md rounded-md p-4 h-[340px]">
            <div className="flex justify-center items-center h-full">
              <p className="text-red-500">{t("weight.chartError")}</p>
            </div>
          </div>
        ) : (
          weightData &&
          weightData.length > 0 && (
            <div className="mt-5">
              <WeightFeedChart data={weightData} />
            </div>
          )
        )}

        <div className="mt-10">
          <LinkButton href="/weight/analytics">
            <p>{t("weight.fullAnalytics")}</p>
            <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
