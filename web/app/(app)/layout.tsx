import { Toaster } from "react-hot-toast";
import "../globals.css";
import Navbar from "@/app/(app)/components/navbar/navbar";
import { getUserRoleAndPreferences } from "./lib/data";
import HydrateUser from "./components/HydrateUser";
import { redirect } from "next/navigation";
import { getFeed } from "@/app/(app)/lib/data";
import { getFeedKey } from "./lib/feedKeys";
import SWRProvider from "./components/layoutSWR";
import { unstable_serialize } from "swr/infinite";

export default async function appLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, preferences, role } = await getUserRoleAndPreferences();
  const initialFeed = await getFeed(1, 15);

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <SWRProvider
        fallback={{
          [unstable_serialize(getFeedKey)]: [initialFeed],
        }}
      >
        {children}
      </SWRProvider>
      <HydrateUser preferences={preferences!} role={role} />
    </div>
  );
}
