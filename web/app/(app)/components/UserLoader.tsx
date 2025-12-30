// app/(app)/components/UserLoader.tsx

import { getUserProfile } from "@/app/(app)/database/settings/get-user-profile";
import HydrateUser from "./HydrateUser";

export default async function UserLoader() {
  const { preferences, role } = await getUserProfile();

  return <HydrateUser preferences={preferences} role={role} />;
}
