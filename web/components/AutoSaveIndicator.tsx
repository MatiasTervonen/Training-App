"use client";

import { useTranslation } from "react-i18next";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";

type Props = {
  status: AutoSaveStatus;
};

export default function AutoSaveIndicator({ status }: Props) {
  const { t } = useTranslation("common");

  if (status === "idle") return null;

  return (
    <div className="bg-slate-900 fixed top-5 z-50 py-1 px-4 rounded-lg ml-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 flex items-center justify-center">
          {status === "saving" && (
            <Loader2 size={16} className="text-slate-400 animate-spin" />
          )}
          {status === "saved" && <Check size={16} className="text-green-500" />}
          {status === "error" && (
            <AlertTriangle size={16} className="text-red-500" />
          )}
        </div>
        <div className="relative">
          {/* Invisible widest label sets the container width */}
          <span className="text-sm font-primary opacity-0">
            {t("common.autoSave.saving")}
          </span>
          <span className="absolute inset-0 flex items-center">
            {status === "saving" && (
              <span className="text-sm font-primary text-slate-300">
                {t("common.autoSave.saving")}
              </span>
            )}
            {status === "saved" && (
              <span className="text-sm font-primary text-green-500">
                {t("common.autoSave.saved")}
              </span>
            )}
            {status === "error" && (
              <span className="text-sm font-primary text-red-500">
                {t("common.autoSave.error")}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
