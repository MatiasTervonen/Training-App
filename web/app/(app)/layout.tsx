import { Toaster } from "react-hot-toast";
import "../globals.css";
import ChatButton from "./components/ChatButton";
import Navbar from "@/app/(app)/components/navbar/navbar";
import { getUserRoleAndPreferences } from "./lib/data";
import HydrateUser from "./components/HydrateUser";
import { redirect } from "next/navigation";

export default async function appLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, preferences, role } = await getUserRoleAndPreferences();

  if (!user) {
    redirect("/login");
  }
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      {children}
      <ChatButton />
      <HydrateUser preferences={preferences!} role={role} />
    </div>
  );
}
