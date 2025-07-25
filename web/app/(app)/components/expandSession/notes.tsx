import { formatDate } from "@/app/(app)/lib/formatDate";
import CopyButton from "../CopyButton";
import { notes } from "@/app/(app)/types/models";

type Props = {
  notes: notes;
};

export default function NotesSession({ notes }: Props) {
  return (
    <div
      className="text-center p-4 text-gray-100 max-w-md mx-auto"
    >
      <div className="text-sm text-gray-400">
        {formatDate(notes.created_at)}
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
