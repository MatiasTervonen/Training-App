import {
  useUserStore,
  UserProfile,
  UserSettings,
} from "@/lib/stores/useUserStore";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { Linking, Alert, View, ActivityIndicator, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { getRouteForNotification } from "@/features/notifications/getRouteForNotification";
import { Session } from "@supabase/supabase-js";
import { fetchUserProfile } from "@/database/settings/get-user-profile";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { fetchUserSettings } from "@/database/settings/get-user-settings";
import i18n from "@/app/i18n";
import { useNotificationSubscription } from "@/features/notifications/hooks/useNotificationSubscription";
import useNotificationNavigation from "@/features/notifications/useNotificationNavigation";
import { useStepGoalSync } from "@/features/habits/hooks/useStepGoalSync";
import { queryClient } from "@/lib/queryClient";
import { syncNotifications } from "@/database/reminders/syncNotifications";
import { syncHabitNotifications } from "@/database/habits/syncHabitNotifications";
import { syncAlarms } from "@/database/reminders/syncAlarms";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionChecked, setSessionChecked] = useState(false);
  // Only show the loading spinner when a notification tap needs to redirect —
  // normal app opens should render children immediately (no spinner flash).
  const [hasPendingNotification] = useState(() => {
    const lastResponse = Notifications.getLastNotificationResponse();
    if (!lastResponse) return false;
    if (
      lastResponse.actionIdentifier !==
      Notifications.DEFAULT_ACTION_IDENTIFIER
    )
      return false;
    return !!getRouteForNotification(
      lastResponse.notification.request.content.data,
    );
  });

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

  // Handle notification tap navigation (waits for auth, prevents dashboard flash)
  useNotificationNavigation(sessionChecked);

  // Sync step habit goals to native SharedPreferences for background notifications
  useStepGoalSync();

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
          // Clear any stale query results from before authentication
          queryClient.invalidateQueries();

          // Sync notifications if push is enabled (handles reinstall/re-login)
          if (settingsData?.push_enabled) {
            Promise.all([
              syncNotifications(),
              syncHabitNotifications(),
              Platform.OS === "android" ? syncAlarms() : Promise.resolve(),
            ]).catch(() => {
              // Non-critical — notifications will be missing but app still works
            });
          }
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
        if (latestSettings?.has_completed_onboarding === false) {
          if (
            !skipRedirect &&
            !currentPathname.startsWith("/onboarding")
          ) {
            router.replace("/onboarding");
          }
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
            const lastNotifResponse = Notifications.getLastNotificationResponse();

            const hasDeepLink =
              initialUrl != null &&
              initialUrl.startsWith("kurvi://") &&
              initialUrl.length > "kurvi://".length;

            // Check if a notification tap will handle navigation
            const hasNotificationNav =
              lastNotifResponse?.actionIdentifier ===
                Notifications.DEFAULT_ACTION_IDENTIFIER &&
              !!getRouteForNotification(
                lastNotifResponse?.notification.request.content.data,
              );

            if (hasDeepLink || hasNotificationNav) {
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

        if (event === "SIGNED_IN") {
          handleSessionChange(session);
        } else {
          // TOKEN_REFRESHED, SIGNED_OUT — no redirect
          handleSessionChange(session, true);
        }
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

  if (!sessionChecked && hasPendingNotification) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#9ca3af" />
      </View>
    );
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
