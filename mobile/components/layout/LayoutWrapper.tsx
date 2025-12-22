import { useUserStore } from "@/lib/stores/useUserStore";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { fetchUserProfile } from "@/database/settings/get-user-profile";
import ModalPageWrapper from "../ModalPageWrapper";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import syncNotifications from "@/database/reminders/syncNotifications";
import { getPushEnabled } from "@/database/pushState/get-push-enabled";
import { fetchUserSettings } from "@/database/settings/get-user-settings";

interface UserProfile {
  id: string;
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  role: string;
}

interface UserSettings {
  push_enabled: boolean;
  gps_tracking_enabled: boolean;
}

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionChecked, setSessionChecked] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const logoutUser = useUserStore((state) => state.logoutUser);

  const loginUser = useUserStore((state) => state.loginUser);

  const { modalPageConfig, setModalPageConfig } = useModalPageConfig();

  const didSyncNotifications = useRef(false);

  const handleSessionChange = async (session: Session | null) => {
    if (!session) {
      logoutUser();
      if (pathname !== "/") router.replace("/");
      return;
    }

    let profile = useUserStore.getState().profile;
    let settings = useUserStore.getState().settings;

    if (!profile || !settings) {
      console.log("Fetching user profile and settings");
      const [profileData, settingsData] = await Promise.all([
        fetchUserProfile(),
        fetchUserSettings(),
      ]);
      console.log("Profile data", profileData);
      console.log("Settings data", settingsData);
      profile = profileData as UserProfile;
      settings = settingsData as UserSettings;
      console.log("Logging in user with profile and settings");
      loginUser(profile, settings);
      console.log("User logged in");
    }

    const pushEnabled = await getPushEnabled();

    useUserStore.getState().setUserProfile(profile);
    useUserStore.getState().setUserSettings(settings);

    // Sync notifications when user opens app.
    if (pushEnabled && !didSyncNotifications.current) {
      console.log("Syncing notifications for the first time");
      didSyncNotifications.current = true;
      syncNotifications().catch(() => {});
    }

    if (pathname !== "/dashboard") {
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session).finally(() => {
        setSessionChecked(true);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "USER_UPDATED") {
          // user changed password, don't redirect
          return;
        }
        handleSessionChange(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pathname !== "/dashboard") {
      setModalPageConfig(null);
    }
  }, [pathname, setModalPageConfig]);

  if (!sessionChecked) {
    return null;
  }

  const noModalRoutes = ["/", "/login"];
  const shouldRenderModal = !noModalRoutes.includes(pathname);

  if (!shouldRenderModal) {
    return <>{children}</>;
  }

  return (
    <ModalPageWrapper key={pathname} {...(modalPageConfig || {})}>
      {children}
    </ModalPageWrapper>
  );
}
