import GetSession from "@/lib/getSession";
import SessionFeed from "./ui/homepage/sessionFeed";
import ActiveSessionPopup from "./components/activeSessionPopup";

export default async function Home() {
  const { session } = await GetSession();

  return (
    <div className="bg-slate-900 min-h-screen w-full">
      <ActiveSessionPopup />
      <SessionFeed sessions={session} />
    </div>
  );
}
