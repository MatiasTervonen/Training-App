import { Session } from "@/types/session";

export default function NotesSession({ session }: { session: Session }) {
  return <div>{session.notes}</div>;
}
