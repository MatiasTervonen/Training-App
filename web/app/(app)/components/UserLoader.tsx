// app/(app)/components/UserLoader.tsx
import { getUserRoleAndPreferences } from "@/app/(app)/database/settings";
import HydrateUser from "./HydrateUser";

export default async function UserLoader() {
  const { preferences, role } = await getUserRoleAndPreferences();

  return <HydrateUser preferences={preferences} role={role} />;
}
