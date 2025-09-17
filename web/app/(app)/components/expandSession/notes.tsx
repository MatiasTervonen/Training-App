import { formatDate } from "@/app/(app)/lib/formatDate";
import CopyButton from "../CopyButton";
import { feed_view } from "@/app/(app)/types/session";

export default function NotesSession(notes: feed_view) {
  return (
    <div className="text-center px-4 text-gray-100 max-w-md mx-auto pb-10">
      <div className="text-sm text-gray-400 mt-5">
        {formatDate(notes.created_at!)}
      </div>
      <div id="notes-id">
        <div className="my-5 text-xl">{notes.title}</div>
        <div className="whitespace-pre-wrap break-words overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          {notes.notes}
        </div>
      </div>
      <CopyButton targetId="notes-id" />
    </div>
  );
}
