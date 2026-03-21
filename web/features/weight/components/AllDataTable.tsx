"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "@/lib/stores/useUserStore";
import { weight } from "@/types/models";
import { deleteSession } from "@/database/feed/deleteSession";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type AllDataProps = {
  data: weight[];
};

export default function AllDataTable({ data }: AllDataProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;
  const [expanded, setExpanded] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const sortedData = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [data],
  );

  const sections = useMemo(() => {
    const grouped = sortedData.reduce(
      (acc, entry) => {
        const date = new Date(entry.created_at);
        const monthYear = date.toLocaleString(locale, {
          month: "long",
          year: "numeric",
        });

        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(entry);
        return acc;
      },
      {} as Record<string, weight[]>,
    );

    return Object.entries(grouped).map(([month, entries]) => {
      const diff =
        entries.length > 1
          ? entries[0].weight - entries[entries.length - 1].weight
          : 0;
      const rounded = Math.round(diff * 10) / 10;
      const formatted =
        rounded > 0 ? `+ ${rounded}` : rounded < 0 ? `${rounded}` : `${rounded}`;
      return { title: month, entries, difference: formatted };
    });
  }, [sortedData, locale]);

  const handleDelete = async (id: string) => {
    const confirmed = confirm(t("weight.analyticsScreen.deleteConfirm"));
    if (!confirmed) return;

    const queryKey = ["get-weight"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<weight[]>(queryKey, (oldData) => {
      if (!oldData) return;
      return oldData.filter((w) => w.id !== id);
    });

    try {
      await deleteSession(id, "weight");
      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      toast.success(t("weight.analyticsScreen.deletedMessage"));
    } catch {
      toast.error(t("weight.analyticsScreen.deleteErrorMessage"));
      queryClient.setQueryData(queryKey, previousFeed);
    } finally {
      setExpanded(null);
    }
  };

  return (
    <div>
      {sections.map((section) => (
        <div key={section.title}>
          {/* Month header */}
          <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
            <span className="text-lg">{section.title}</span>
            <span className="font-body text-gray-200">
              {section.difference} {weightUnit}
            </span>
          </div>

          {/* Rows */}
          {section.entries.map((entry) => (
            <div key={entry.id}>
              <div className="border-b border-gray-700 px-4 py-3 bg-gray-900">
                <div className="flex justify-between items-center">
                  <span className="text-base min-w-[70px]">
                    {entry.weight} {weightUnit}
                  </span>
                  <span className="text-gray-400 font-body">
                    {new Date(entry.created_at).toLocaleDateString(locale)}
                  </span>
                  <button
                    onClick={() =>
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }
                    className="text-gray-300 cursor-pointer"
                  >
                    <ChevronRight
                      size={20}
                      className={`transition-transform ${
                        expanded === entry.id ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {expanded === entry.id && (
                <div className="bg-gray-800 px-6 py-3">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-300 flex-1 mr-3 font-body whitespace-pre-wrap wrap-break-word">
                      {entry.notes || t("weight.analyticsScreen.noNotes")}
                    </p>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="cursor-pointer"
                    >
                      <Trash2 size={20} className="text-gray-300" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
