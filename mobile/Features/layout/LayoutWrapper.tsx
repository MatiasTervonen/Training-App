import { useUserStore, UserProfile, UserSettings } from "@/lib/stores/useUserStore";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { fetchUserProfile } from "@/database/settings/get-user-profile";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { fetchUserSettings } from "@/database/settings/get-user-settings";
import i18n from "@/app/i18n";

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
  const hasHydrated = useUserStore((state) => state._hasHydrated);

  const { modalPageConfig, setModalPageConfig } = useModalPageConfig();

  const handleSessionChange = async (session: Session | null) => {
    if (!session) {
      logoutUser();
      if (pathname !== "/") router.replace("/");
      return;
    }

    const { profile, settings } = useUserStore.getState();

    if (!profile || !settings) {
      const [profileData, settingsData] = await Promise.all([
        fetchUserProfile(),
        fetchUserSettings(),
      ]);
      loginUser(profileData as UserProfile, settingsData as UserSettings);
      // Only override device language if user explicitly set a preference
      if (settingsData?.language) {
        i18n.changeLanguage(settingsData.language);
      }
    } else if (settings?.language) {
      // Only override device language if user explicitly set a preference (from cache)
      i18n.changeLanguage(settings.language);
    }

    if (pathname !== "/dashboard") {
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session).finally(() => {
        setSessionChecked(true);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "USER_UPDATED") {
          // user changed password, don't redirect
          return;
        }
        handleSessionChange(session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

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
