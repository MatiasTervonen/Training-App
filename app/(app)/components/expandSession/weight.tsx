import { formatDate } from "@/app/(app)/lib/formatDate";
import { russoOne } from "@/app/ui/fonts";
import { Weight } from "@/app/(app)/types/session";
import Link from "next/link";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";

export default function WeightSession(weight: Weight) {
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <div
      className={`${russoOne.className} text-center p-4 text-gray-100 max-w-md mx-auto`}
    >
      <div className="text-sm text-gray-400">
        {formatDate(weight.created_at)}
      </div>
      <div id="notes-id">
        <div className="my-5 text-xl">{weight.title}</div>
        <div className="whitespace-pre-wrap break-words overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          <div className="flex flex-col">
            {weight.notes && (
              <p className="mb-5">{weight.notes}</p> // Add gap only if notes exist
            )}
            <p className="text-center">
              {weight.weight} {weightUnit}
            </p>
          </div>
        </div>
        <Link
          href="/weight/analytics"
          className={`${russoOne.className} mt-10 flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100  cursor-pointer hover:bg-blue-700 hover:scale-95`}
        >
          View Full History
        </Link>
      </div>
    </div>
  );
}
