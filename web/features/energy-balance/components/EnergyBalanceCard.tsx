"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEnergyBalance } from "@/features/energy-balance/hooks/useEnergyBalance";
import { saveActivityLevel } from "@/database/energy-balance/save-activity-level";
import BalanceBar from "@/features/energy-balance/components/BalanceBar";
import BreakdownRow from "@/features/energy-balance/components/BreakdownRow";
import ActivityLevelSelector from "@/features/energy-balance/components/ActivityLevelSelector";
import Spinner from "@/components/spinner";

type EnergyBalanceCardProps = {
  date: string;
};

export default function EnergyBalanceCard({ date }: EnergyBalanceCardProps) {
  const { t } = useTranslation("nutrition");
  const queryClient = useQueryClient();
  const { data, isLoading } = useEnergyBalance(date);
  const [expanded, setExpanded] = useState(false);

  const handleActivityLevelChange = useCallback(
    async (level: number) => {
      try {
        await saveActivityLevel(date, level);
        queryClient.invalidateQueries({ queryKey: ["energyBalance", date] });
      } catch {
        // Error already handled in saveActivityLevel
      }
    },
    [date, queryClient],
  );

  if (isLoading) {
    return (
      <div className="mt-4 bg-slate-800/50 rounded-xl p-4 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  const isDeficit = data.balance < 0;
  const balanceColor = isDeficit ? "text-green-400" : "text-amber-400";
  const balanceLabel = isDeficit
    ? t("energyBalance.deficit")
    : t("energyBalance.surplus");

  return (
    <div className="mt-4 bg-slate-800/50 rounded-xl p-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center w-full cursor-pointer"
      >
        <span className="text-base">
          {t("energyBalance.title")}
        </span>
        {expanded ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>

      {/* Balance summary (always visible) */}
      <div className="flex flex-col items-center mt-3">
        <BalanceBar balance={data.balance} tdee={data.tdee} />
        <div className="flex items-baseline mt-2 gap-1">
          <span className={`text-xl ${balanceColor}`}>
            {data.balance > 0 ? "+" : ""}
            {Math.round(data.balance).toLocaleString()}
          </span>
          <span className="text-sm font-body text-slate-400">
            kcal ({balanceLabel})
          </span>
        </div>
      </div>

      {/* Activity level selector (always visible) */}
      <ActivityLevelSelector
        level={data.activity_level}
        onSelect={handleActivityLevelChange}
      />

      {/* Expanded breakdown */}
      {expanded && (
        <div className="mt-4">
          {/* Calories In */}
          <BreakdownRow
            label={t("energyBalance.caloriesIn")}
            value={data.calories_consumed}
          />

          {/* Divider */}
          <div className="h-px bg-slate-700 my-2" />

          {/* Calories Out breakdown */}
          <BreakdownRow
            label={t("energyBalance.baseBurn")}
            value={data.base_burn}
          />
          <BreakdownRow
            label={t("energyBalance.exercise")}
            value={data.net_exercise_calories}
          />
          <BreakdownRow
            label={t("energyBalance.tef")}
            value={data.tef}
          />

          {/* Divider */}
          <div className="h-px bg-slate-700 my-2" />

          {/* Total */}
          <BreakdownRow
            label={t("energyBalance.totalBurn")}
            value={data.tdee}
          />

          {/* Profile prompt */}
          {!data.has_profile && (
            <Link
              href="/menu/profile"
              className="flex items-center gap-2 mt-3 bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors"
            >
              <Info size={16} className="text-blue-400 shrink-0" />
              <span className="font-body text-xs text-blue-400">
                {t("energyBalance.completeProfile")}
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
