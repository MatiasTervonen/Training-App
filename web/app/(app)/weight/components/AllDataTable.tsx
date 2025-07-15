import { ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import React from "react";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";

type WeightEntry = {
  id: string;
  title: string;
  user_id: string;
  weight: number;
  created_at: string;
  notes: string;
};

type AllDataProps = {
  data: WeightEntry[];
};

export default function AllDataTable({ data }: AllDataProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const sortedData = [...data].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;

    mutate(
      "/api/weight/get-weight",
      (currentData: WeightEntry[] = []) => {
        return currentData.filter((entry) => entry.id !== id);
      },
      false
    ); // Optimistically update the data

    try {
      const res = await fetch("/api/delete-sessionn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: id,
          table: "weight",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update weight session");
      }

      await res.json();

      mutate("/api/weight/get-weight");
    } catch (error) {
      toast.error("Failed to delete weight entry");
      console.error("Failed to delete weight entry:", error);
      mutate("/api/weight/get-weight");
    } finally {
      setExpanded(null); // Collapse any expanded row after deletion}
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Weight
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {sortedData.map((entry) => (
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
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-300">
                    <div className="flex justify-between items-center whitespace-pre-wrap break-words">
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
        </tbody>
      </table>
    </div>
  );
}
