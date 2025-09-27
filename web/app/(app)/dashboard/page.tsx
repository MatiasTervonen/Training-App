import ActiveSessionPopup from "../components/activeSessionPopup";
import ClientModalWrapper from "../components/ClientModalWrapper";
import SessionFeed from "../ui/homepage/sessionFeed";

export default function Home() {
  return (
    <ClientModalWrapper>
      <div>
        <ActiveSessionPopup />
        <SessionFeed />
      </div>
    </ClientModalWrapper>
  );
}
