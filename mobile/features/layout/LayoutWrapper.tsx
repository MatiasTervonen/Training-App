import {
  useUserStore,
  UserProfile,
  UserSettings,
} from "@/lib/stores/useUserStore";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { Linking, Alert } from "react-native";
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

  const handleSessionChange = async (
    session: Session | null,
    skipRedirect = false,
  ) => {
    if (!session) {
      logoutUser();
      if (pathname !== "/") router.replace("/");
      return;
    }

    const { profile, settings } = useUserStore.getState();

    try {
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

      // Check onboarding status after login (strict === false so undefined/missing is treated as completed)
      const latestSettings = useUserStore.getState().settings;
      if (
        !skipRedirect &&
        latestSettings?.has_completed_onboarding === false &&
        !pathname.startsWith("/onboarding")
      ) {
        router.replace("/onboarding");
        return;
      }

      if (!skipRedirect && pathname !== "/dashboard") {
        router.replace("/dashboard");
      }
    } catch {
      if (!profile || !settings) {
        Alert.alert(
          "Error",
          "An error occurred while loading your profile. Please log in again.",
        );
        logoutUser();
        if (pathname !== "/") router.replace("/");
      }
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          handleSessionChange(session);
          return;
        }

        // Check if app was launched via widget deep link (e.g. mytrack://gym)
        const initialUrl = await Linking.getInitialURL();
        const hasDeepLink =
          initialUrl != null &&
          initialUrl.startsWith("mytrack://") &&
          initialUrl.length > "mytrack://".length;

        if (hasDeepLink) {
          // Load user data but skip dashboard redirect (unless onboarding needed)
          await handleSessionChange(session, true);
          // If onboarding not completed, redirect there even from deep link
          const settings = useUserStore.getState().settings;
          if (settings?.has_completed_onboarding === false) {
            router.replace("/onboarding");
          } else {
            useAppReadyStore.getState().setFeedReady();
          }
        } else {
          await handleSessionChange(session);
        }
      })
      .finally(() => {
        setSessionChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "USER_UPDATED" || event === "INITIAL_SESSION") {
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
  const isOnboarding = pathname.startsWith("/onboarding");
  const shouldRenderModal = !noModalRoutes.includes(pathname) && !isOnboarding;

  if (!shouldRenderModal) {
    return <>{children}</>;
  }

  return (
    <ModalPageWrapper key={pathname} {...(modalPageConfig || {})}>
      {children}
    </ModalPageWrapper>
  );
}
