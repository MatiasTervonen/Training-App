import { formatDate } from "@/lib/formatDate";
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
    <div className={`${russoOne.className} text-center p-4 text-gray-100 `}>
      {formatDate(notes.created_at)}
      <div id="notes-id">
        <div className="my-5">{notes.title}</div>
        <div className="whitespace-pre-wrap break-words overflow-hidden max-w-full text-left">
          {notes.notes}
        </div>
      </div>
      <CopyButton targetId="notes-id" />
    </div>
  );
}
