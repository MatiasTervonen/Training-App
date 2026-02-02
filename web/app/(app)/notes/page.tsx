import { NotebookPen, List } from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";

export default function Sessions() {
  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">Start Session</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/notes/quick-notes">
          <p>Quick-Notes</p>
          <NotebookPen />
        </LinkButton>

        <LinkButton href="/notes/my-notes">
          My-Notes
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
