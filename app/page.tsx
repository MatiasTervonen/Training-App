import GetSession from "@/lib/getSession";
import SessionFeed from "./ui/homepage/sessionFeed";
import ActiveSessionPopup from "./components/activeSessionPopup";
import ClientModalWrapper from "./components/ClientModalWrapper";

export default async function Home() {
  const { session } = await GetSession();

  return (
    <ClientModalWrapper>
      <div>
        <ActiveSessionPopup />
        <SessionFeed sessions={session} />
      </div>
    </ClientModalWrapper>
  );
}
