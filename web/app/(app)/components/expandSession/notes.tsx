import { formatDate } from "@/app/(app)/lib/formatDate";
import CopyButton from "../buttons/CopyButton";
import { notes } from "@/app/(app)/types/models";

export default function NotesSession(notes: notes) {
  return (
    <div className="text-center max-w-lg mx-auto page-padding">
      <div className="flex flex-col gap-2 text-sm text-gray-400">
        <p>Created: {formatDate(notes.created_at)}</p>
        {notes.updated_at && (
          <p className="text-yellow-500">
            Updated: {formatDate(notes.updated_at)}
          </p>
        )}
      </div>
      <div id="notes-id">
        <div className="my-5 text-xl wrap-break-word">{notes.title}</div>
        <div className="whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-md">
          {notes.notes}
        </div>
      </div>
      <CopyButton targetId="notes-id" />
    </div>
  );
}
