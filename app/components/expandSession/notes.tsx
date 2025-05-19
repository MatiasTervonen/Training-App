import { Session } from "@/types/session";
import { formatDate } from "@/lib/formatDate";

export default function NotesSession({ session }: { session: Session }) {
  return (
    <div className="p-4 text-gray-100">
      {formatDate(session.created_at)}
      <div className="my-5">{session.title}</div>
      <div className="whitespace-pre-wrap break-words overflow-hidden max-w-full">
        {session.notes}
      </div>
    </div>
  );
}
