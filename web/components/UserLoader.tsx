// app/(app)/components/UserLoader.tsx

import { getUserProfile } from "@/database/settings/get-user-profile";
import { getUserSettings } from "@/database/settings/get-user-settings";
import HydrateUser from "@/components/HydrateUser";

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
