import { Globe } from "lucide-react";
import LinkButton from "../ui/LinkButton";

export default function Sessions() {
  return (
    <div className="p-5 h-full max-w-md mx-auto">
      <h1 className="text-center mt-5 mb-10 text-2xl ">Reminders</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/reminders/global-reminders">
          One-Time Global
          <Globe />
        </LinkButton>

        <LinkButton href="/reminders/my-reminders">My Reminders</LinkButton>
      </div>
    </div>
  );
}
