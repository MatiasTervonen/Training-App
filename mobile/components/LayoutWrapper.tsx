import { useUserStore } from "@/lib/stores/useUserStore";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { fetchUserPreferences } from "@/database/settings/get-settings";
import ModalPageWrapper from "./ModalPageWrapper";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import syncNotifications from "@/database/reminders/syncNotifications";
import { getPushEnabled } from "@/database/pushState/get-push-enabled";

interface UserPreferences {
  id: string;
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  role: string;
  push_enabled: boolean;
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
    console.log("handleSessionChange");

    if (!session) {
      logoutUser();
      if (pathname !== "/") router.replace("/");
      return;
    }

    let preferences = useUserStore.getState().preferences;

    if (!preferences) {
      const data = await fetchUserPreferences();
      loginUser(data as UserPreferences);
      preferences = data as UserPreferences;
    }

    const pushEnabled = await getPushEnabled();

    useUserStore.getState().setUserPreferences({
      ...preferences,
      push_enabled: pushEnabled,
    } as UserPreferences);

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
    return null; // keep splash screen visible
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
