import { Toaster } from "react-hot-toast";
import "../globals.css";
import UserLoader from "./components/UserLoader";
import { Suspense } from "react";
import RootClientWrapper from "./components/rootClientWrapper";
import { createClient } from "@/utils/supabase/server";

export default async function appLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <RootClientWrapper initialUser={user}>{children}</RootClientWrapper>
      <Suspense fallback={null}>
        <UserLoader />
      </Suspense>
    </div>
  );
}
