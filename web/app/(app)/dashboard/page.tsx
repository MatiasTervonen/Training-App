import ActiveSessionPopup from "../components/activeSessionPopup";
import ClientModalWrapper from "../components/ClientModalWrapper";
import FeedSection from "./components/feedSection";
import { Suspense } from "react";
import { FeedSkeleton } from "../ui/loadingSkeletons/skeletons";

export default async function Home() {

  return (
    <ClientModalWrapper>
      <div>
        <ActiveSessionPopup />
        <Suspense fallback={<FeedSkeleton count={6} />}>
          <FeedSection />
        </Suspense>
      </div>
    </ClientModalWrapper>
  );
}
