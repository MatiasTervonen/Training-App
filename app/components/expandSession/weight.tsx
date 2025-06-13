import { formatDate } from "@/lib/formatDate";
import { russoOne } from "@/app/ui/fonts";
import { Weight } from "@/types/session";

export default function WeightSession(weight: Weight) {
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
            <p>Weight: {weight.weight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
