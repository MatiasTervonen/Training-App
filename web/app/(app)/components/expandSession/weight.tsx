import { formatDate } from "@/app/(app)/lib/formatDate";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { weight } from "../../types/models";
import LinkButton from "../../ui/LinkButton";

export default function WeightSession(weight: weight) {
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <div className="text-center max-w-md mx-auto page-padding">
      <div className="text-sm text-gray-400">
        {formatDate(weight.created_at!)}
      </div>
      <div id="notes-id">
        <div className="my-5 text-xl wrap-break-word">{weight.title}</div>
        <div className="whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          <div className="flex flex-col">
            {weight.notes && <p className="mb-5">{weight.notes}</p>}
            <p className="text-center">
              {weight.weight} {weightUnit}
            </p>
          </div>
        </div>
        <div className="mt-10">
          <LinkButton href="/weight/analytics">View Full History</LinkButton>
        </div>
      </div>
    </div>
  );
}
