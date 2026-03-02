import {
  useUserStore,
  UserProfile,
  UserSettings,
} from "@/lib/stores/useUserStore";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { Linking, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { fetchUserProfile } from "@/database/settings/get-user-profile";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { fetchUserSettings } from "@/database/settings/get-user-settings";
import i18n from "@/app/i18n";
import { useNotificationSubscription } from "@/features/notifications/hooks/useNotificationSubscription";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionChecked, setSessionChecked] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Keep pathname in a ref so the auth listener always has the current value
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const logoutUser = useUserStore((state) => state.logoutUser);
  const loginUser = useUserStore((state) => state.loginUser);
  const hasHydrated = useUserStore((state) => state._hasHydrated);

  const { modalPageConfig, setModalPageConfig } = useModalPageConfig();

  // Subscribe to realtime notifications for badge updates
  useNotificationSubscription();

  const handleSessionChange = useCallback(
    async (session: Session | null, skipRedirect = false) => {
      const currentPathname = pathnameRef.current;

      if (!session) {
        logoutUser();
        if (currentPathname !== "/") router.replace("/");
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
          !currentPathname.startsWith("/onboarding")
        ) {
          router.replace("/onboarding");
          return;
        }

        if (!skipRedirect && currentPathname !== "/dashboard") {
          router.replace("/dashboard");
        }
      } catch {
        if (!profile || !settings) {
          Alert.alert(
            "Error",
            "An error occurred while loading your profile. Please log in again.",
          );
          logoutUser();
          if (currentPathname !== "/") router.replace("/");
        }
      }
    },
    [logoutUser, loginUser, router],
  );

  // Single auth listener — handles both initial session and subsequent changes
  useEffect(() => {
    if (!hasHydrated) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "USER_UPDATED") return;

        if (event === "INITIAL_SESSION") {
          // This replaces the separate getSession() call
          if (session) {
            const initialUrl = await Linking.getInitialURL();
            const hasDeepLink =
              initialUrl != null &&
              initialUrl.startsWith("mytrack://") &&
              initialUrl.length > "mytrack://".length;

            if (hasDeepLink) {
              await handleSessionChange(session, true);
              const settings = useUserStore.getState().settings;
              if (settings?.has_completed_onboarding === false) {
                router.replace("/onboarding");
              } else {
                useAppReadyStore.getState().setFeedReady();
              }
            } else {
              await handleSessionChange(session);
            }
          } else {
            await handleSessionChange(null);
          }
          setSessionChecked(true);
          return;
        }

        // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
        handleSessionChange(session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [hasHydrated, handleSessionChange, router]);

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
