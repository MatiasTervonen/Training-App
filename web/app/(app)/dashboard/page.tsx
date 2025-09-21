import ActiveSessionPopup from "../components/activeSessionPopup";
import ClientModalWrapper from "../components/ClientModalWrapper";
import SessionFeed from "../ui/homepage/sessionFeed";
import { GetSWRCache } from "../lib/getSWRCache";

export default async function Home() {
  return (
    <ClientModalWrapper>
      <div>
        <GetSWRCache />
        <ActiveSessionPopup />
        <SessionFeed />
      </div>
    </ClientModalWrapper>
  );
}
