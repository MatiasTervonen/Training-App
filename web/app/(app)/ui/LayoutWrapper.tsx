import Navbar from "@/app/(app)/components/navbar/navbar";
import { getUserRoleAndPreferences } from "../lib/data";
import HydrateUser from "../components/HydrateUser";
import { redirect } from "next/navigation";


export default async function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, preferences, role } = await getUserRoleAndPreferences();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Navbar/>

      <main>{children}</main>

      <HydrateUser preferences={preferences!} role={role} />
    </>
  );
}
