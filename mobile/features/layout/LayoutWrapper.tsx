import {
  useUserStore,
  UserProfile,
  UserSettings,
} from "@/lib/stores/useUserStore";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { Linking, Alert,Platform } from "react-native";
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
import BootScreen from "@/features/feed/fakeFeedLoader";

type PendingSession = {
  session: Session;
  skipRedirect: boolean;
};

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionChecked, setSessionChecked] = useState(false);
  // Pending session from SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT events.
  // Set inside the onAuthStateChange callback (which may run inside the
  // Supabase auth lock) and processed by a separate useEffect that runs
  // after the lock is guaranteed to be released. This avoids the deadlock
  // that occurs when supabase.from() calls getSession() → _acquireLock
  // while the lock is still held by exchangeCodeForSession.
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(
    null,
  );
  const [pendingSignOut, setPendingSignOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Track whether INITIAL_SESSION handled a deep link / notification tap,
  // so the subsequent SIGNED_IN event doesn't redirect to dashboard.
  const deepLinkHandledRef = useRef(false);

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

  // Refresh chat unread badge when a chat push notification arrives in-app
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.type === "chat_message") {
        queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    });
    return () => sub.remove();
  }, []);

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
            fetchUserProfile(session.user.id),
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
              deepLinkHandledRef.current = true;
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
          const skipRedirect = deepLinkHandledRef.current;
          setPendingSession({ session: session!, skipRedirect });
        } else if (event === "SIGNED_OUT") {
          setPendingSignOut(true);
        } else {
          // TOKEN_REFRESHED — update session without redirect
          if (session) {
            setPendingSession({ session, skipRedirect: true });
          }
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Process pending session changes outside the auth callback.
  // React schedules this effect after the render triggered by setPendingSession,
  // which guarantees all microtasks (including Supabase lock release) have settled.
  useEffect(() => {
    if (pendingSignOut) {
      setPendingSignOut(false);
      handleSessionChange(null);
      return;
    }
    if (!pendingSession) return;
    const { session, skipRedirect } = pendingSession;
    setPendingSession(null);
    handleSessionChange(session, skipRedirect);
  }, [pendingSession, pendingSignOut, handleSessionChange]);

  useEffect(() => {
    if (pathname !== "/dashboard") {
      setModalPageConfig(null);
    }
  }, [pathname, setModalPageConfig]);

  if (!sessionChecked) {
    return <BootScreen />;
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
