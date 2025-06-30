import { formatDate } from "@/app/(app)/lib/formatDate";
import { russoOne } from "@/app/ui/fonts";
import CopyButton from "../CopyButton";

type Props = {
  notes: {
    created_at: string;
    title: string;
    notes: string;
  };
};

export default function NotesSession({ notes }: Props) {
  return (
    <div
      className={`${russoOne.className} text-center p-4 text-gray-100 max-w-md mx-auto`}
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
