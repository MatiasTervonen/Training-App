// app/(app)/components/UserLoader.tsx
import { getUserRoleAndPreferences } from "../lib/data";
import { redirect } from "next/navigation";
import HydrateUser from "./HydrateUser";

export default async function UserLoader() {
  const { user, preferences, role } = await getUserRoleAndPreferences();

  if (!user) {
    redirect("/login");
  }

  return <HydrateUser preferences={preferences!} role={role} />;
}