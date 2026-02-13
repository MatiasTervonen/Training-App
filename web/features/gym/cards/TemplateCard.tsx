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
    <div className="border rounded-md flex flex-col justify-center transition-colors bg-slate-900 mb-10">
      <div className=" flex justify-between items-center  my-2 mx-4">
        <div className="mr-8 line-clamp-1 text-lg">{item.name}</div>
        <DropdownMenu
          button={
            <div
              aria-label="More options"
              className="flex items-center justify-center rounded-tr-md text-gray-100"
            >
              <Menu size={20} />
            </div>
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      {item.updated_at ? (
        <div className=" text-yellow-500 text-sm ml-4 mb-2">
          {t("feed.card.updated")} {formatDate(item.updated_at)}
        </div>
      ) : (
        <div className="h-5 invisible"></div>
      )}

      <button
        aria-label="Expand template card"
        onClick={onExpand}
        className="flex justify-between items-center px-4 bg-blue-600 rounded-br-md rounded-bl-md hover:bg-blue-500 cursor-pointer py-1"
      >
        <div className="text-gray-200 text-sm">
          {formatDateShort(item.created_at)}
        </div>
        <div className="flex items-center gap-5">
          <p>{t("feed.card.start")}</p>
          <span>
            <Dumbbell size={20} />
          </span>
        </div>
      </button>
    </div>
  );
}
