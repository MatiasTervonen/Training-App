import ActiveSessionPopup from "../components/activeSessionPopup";
import ClientModalWrapper from "../components/ClientModalWrapper";
import SessionFeed from "../ui/homepage/sessionFeed";

export default async function Home() {
  return (
    <ClientModalWrapper>
      <div>
        <ActiveSessionPopup />
        <SessionFeed />
      </div>
    </ClientModalWrapper>
  );
}
