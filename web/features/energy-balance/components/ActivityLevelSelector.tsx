"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

type ActivityLevelSelectorProps = {
  level: number;
  onSelect: (level: number) => void;
};

const LEVELS = [1, 2, 3, 4, 5];

export default function ActivityLevelSelector({
  level,
  onSelect,
}: ActivityLevelSelectorProps) {
  const { t } = useTranslation("nutrition");
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-body text-slate-300">
          {t("energyBalance.activityLevel")}
        </span>
        <button
          onClick={() => setShowInfo(true)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Info size={16} className="text-slate-500" />
        </button>
      </div>

      <div className="flex gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => onSelect(l)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              l === level
                ? "bg-blue-900/60 border border-blue-500/50 text-blue-400"
                : "bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <span className="text-sm">{l}</span>
          </button>
        ))}
      </div>

      {/* Info modal */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-slate-900 rounded-xl p-6 w-full max-w-sm border border-slate-600 shadow-lg shadow-blue-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Info size={24} className="text-amber-400 shrink-0" />
              <span className="text-lg">
                {t("energyBalance.activityLevel")}
              </span>
            </div>

            <p className="font-body text-sm text-slate-300 mb-4 text-center">
              {t("energyBalance.activityInfo")}
            </p>

            {LEVELS.map((l) => (
              <div key={l} className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 rounded-md bg-slate-700/50 flex items-center justify-center mt-0.5 shrink-0">
                  <span className="text-sm text-slate-300">{l}</span>
                </div>
                <div>
                  <span className="font-body text-sm text-slate-200">
                    {t(`energyBalance.activityLevel${l}` as "energyBalance.activityLevel1")}
                  </span>
                  <p className="font-body text-xs text-slate-500">
                    {t(`energyBalance.activityLevel${l}Desc` as "energyBalance.activityLevel1Desc")}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowInfo(false)}
              className="btn-base w-full mt-2"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
