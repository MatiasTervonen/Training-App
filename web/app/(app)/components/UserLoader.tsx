// app/(app)/components/UserLoader.tsx

import { getUserProfile } from "@/app/(app)/database/settings/get-user-profile";
import { getUserSettings } from "@/app/(app)/database/settings/get-user-settings";
import HydrateUser from "./HydrateUser";

export default async function UserLoader() {
  const [{ preferences, role }, settings] = await Promise.all([
    getUserProfile(),
    getUserSettings(),
  ]);

  // Merge language from user_settings into preferences
  const preferencesWithLanguage = {
    ...preferences,
    language: settings?.language as "en" | "fi" | null,
  };

  return <HydrateUser preferences={preferencesWithLanguage} role={role} />;
}
