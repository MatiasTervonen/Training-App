import SessionFeed from "../ui/homepage/sessionFeed";

import ActiveSessionPopup from "../components/activeSessionPopup";
import ClientModalWrapper from "../components/ClientModalWrapper";

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
