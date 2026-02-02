import { Globe, List } from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";

export default function Sessions() {
  return (
    <div className="page-padding h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">Reminders</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/reminders/global-reminders">
          <p>One-Time Global</p>
          <Globe />
        </LinkButton>

        <LinkButton href="/reminders/my-reminders">
          <p>My Reminders</p>
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
