"use client";

import { formatDate, formatDateShort } from "@/lib/formatDate";
import DropdownMenu from "@/components/dropdownMenu";
import { Dumbbell, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
};

type Props = {
  item: templateSummary;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function TemplateCard({
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  const { t } = useTranslation("feed");

  return (
    <div className="shadow-sm shadow-black/50 rounded-md mb-10">
      <div className="border border-slate-700 rounded-md flex flex-col justify-center transition-colors card-gym overflow-hidden">
        <div className="flex justify-between items-center px-4 pt-2 pb-1">
          <div className="mr-8 line-clamp-1 text-lg text-gray-100">{item.name}</div>
          <DropdownMenu
            button={
              <div
                aria-label="More options"
                className="cursor-pointer text-slate-400"
              >
                <Menu size={20} />
              </div>
            }
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
        {item.updated_at && (
          <div className="text-slate-400 text-sm px-4 pb-1 font-body">
            {t("feed.card.updated")} {formatDate(item.updated_at)}
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-900/40 px-4 py-2 mt-2">
          <span className="text-slate-400 text-sm">
            {formatDateShort(item.created_at)}
          </span>
          <button
            aria-label="Expand template card"
            onClick={onExpand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-slate-500 text-sm">{t("feed.card.start")}</span>
            <Dumbbell size={20} className="text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
