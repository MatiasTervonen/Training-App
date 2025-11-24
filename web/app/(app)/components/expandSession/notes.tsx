import { formatDate } from "@/app/(app)/lib/formatDate";
import CopyButton from "../CopyButton";
import { notes } from "@/app/(app)/types/models";

export default function NotesSession(notes: notes) {
  return (
    <div className="text-center max-w-lg mx-auto page-padding">
      <div className="text-sm text-gray-400">
        {formatDate(notes.created_at)}
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
