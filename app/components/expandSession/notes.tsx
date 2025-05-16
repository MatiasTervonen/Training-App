import { Session } from "@/types/session";
import { formatDate } from "@/lib/formatDate";

export default function NotesSession({ session }: { session: Session }) {
  return (
    <div className="p-6">
      {formatDate(session.created_at)}
      <div className="my-5">{session.title}</div>
      <div>{session.notes}</div>
    </div>
  );
}
