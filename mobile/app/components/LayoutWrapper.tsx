import { useUserStore } from "../../lib/stores/useUserStore";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { Session } from "@supabase/supabase-js";

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}

type Store = {
  router: ReturnType<typeof useRouter>;
  preferences: UserPreferences | null;
  logoutUser: () => void;
  loginUser: (
    prefs: UserPreferences,
    isGuest: boolean,
    session: Session
  ) => void;
};

const handleSessionChange = async (session: Session | null, store: Store) => {
  const { router, loginUser, logoutUser } = store;

  if (!session) {
    logoutUser();
    router.replace("/");
    return;
  }

  router.replace("/dashboard");

  const isGuest = session?.user?.app_metadata?.role === "guest";
  const preferences = useUserStore.getState().preferences;

  if (!preferences) {
    try {
      const response = await fetch(
        "https://training-app-bay.vercel.app/api/settings/get-settings",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user preferences");
      }

      const data = await response.json();
      loginUser(data, isGuest, session);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      console.log("No preferences fetched (likely not logged in yet)");
      Alert.alert("Failed to load user preferences. Please try again.");
    }
  }
};

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = useUserStore((state) => state.preferences);

  const logoutUser = useUserStore((state) => state.logoutUser);

  const loginUser = useUserStore((state) => state.loginUser);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session, {
        router,
        preferences,
        loginUser,
        logoutUser,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  console.log("LayoutWrapper rendered with preferences:", preferences);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        handleSessionChange(session, {
          router,
          preferences,
          loginUser,
          logoutUser,
        });
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return <>{children}</>;
}
