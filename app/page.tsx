import GetSession from "@/lib/getSession";
import SessionFeed from "./ui/homepage/sessionFeed";
import GetPinned from "@/lib/getPinned";
import ActiveSessionPopup from "./components/activeSessionPopup";
import ClientModalWrapper from "./components/ClientModalWrapper";

export default async function Home() {
  const { feed } = await GetSession();
  const { pinned } = await GetPinned();

  const pinnedItems = new Set(pinned.map((item) => item.item));

  const feedWithPinned = feed.map((item) => ({
    ...item,
    pinned: pinnedItems.has(item.item.id),
  }));

  return (
    <ClientModalWrapper>
      <div>
        <ActiveSessionPopup />
        <SessionFeed feed={feedWithPinned} />
      </div>
    </ClientModalWrapper>
  );
}
