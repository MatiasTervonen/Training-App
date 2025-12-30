"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { weight } from "@/app/(app)/types/models";
import { deleteSession } from "@/app/(app)/database/feed/deleteSession";
import { useQueryClient } from "@tanstack/react-query";

type AllDataProps = {
  data: weight[];
};

export default function AllDataTable({ data }: AllDataProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const sortedData = [...data].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const groupedData = sortedData.reduce((acc, entry) => {
    const date = new Date(entry.created_at);
    const monthYear = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(entry);
    return acc;
  }, {} as Record<string, weight[]>);

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this entry?");
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

      toast.success("Item has been deleted successfully.");
    } catch {
      toast.error("Failed to delete weight entry");
      queryClient.setQueryData(queryKey, previousFeed);
    } finally {
      setExpanded(null); // Collapse any expanded row after deletion
    }
  };

  return (
    <div className="overflow-x-auto touch-pan-y">
      <table className="min-w-full divide-y divide-gray-700">
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {Object.entries(groupedData).map(([month, entries]) => {
            const monthlyDifference =
              entries.length > 1
                ? entries[0].weight - entries[entries.length - 1].weight
                : 0;

            const rounded = Math.round(monthlyDifference * 10) / 10;

            const formatted =
              rounded > 0
                ? `+ ${rounded}`
                : rounded < 0
                ? `- ${Math.abs(rounded)}`
                : `${rounded}`;

            return (
              <React.Fragment key={month}>
                <tr className="bg-gray-900">
                  <td colSpan={3} className="px-4 py-3 text-gray-200">
                    <div className="flex justify-between items-center">
                      <span>{month}</span>
                      <span>
                        {formatted} {weightUnit}
                      </span>
                    </div>
                  </td>
                </tr>
                {entries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {entry.weight} {weightUnit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end">
                        <button
                          onClick={() =>
                            setExpanded(expanded === entry.id ? null : entry.id)
                          }
                          className="text-gray-300"
                        >
                          <ChevronRight
                            size={20}
                            className={`transition-transform ${
                              expanded === entry.id ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      </td>
                    </tr>

                    {expanded === entry.id && (
                      <tr className="bg-gray-700">
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-sm text-gray-300"
                        >
                          <div className="flex justify-between items-center whitespace-pre-wrap wrap-break-word">
                            <p>{entry.notes || "No notes..."}</p>
                            <button
                              onClick={() => {
                                handleDelete(entry.id);
                              }}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
