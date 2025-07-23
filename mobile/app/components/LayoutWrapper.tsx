import { useUserStore } from "../../lib/stores/useUserStore";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = useUserStore((state) => state.preferences);

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  const setIsLoggedIn = useUserStore((state) => state.setIsLoggedIn);

  const clearPreferences = useUserStore((state) => state.clearUserPreferences);

  const setIsGuest = useUserStore((state) => state.setIsGuest);

  const router = useRouter();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) {
          router.replace("/login");
        } else {
          router.replace("/dashboard");
        }

        if (session?.user?.app_metadata?.role === "guest") {
          setIsGuest(true);
        } else {
          setIsGuest(false);
        }

        if (session) {
          setIsLoggedIn(true);

          if (preferences) return;

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

            setPreferences(data);
          } catch (error) {
            console.error("Error fetching user preferences:", error);
            console.log("No preferences fetched (likely not logged in yet)");
            Alert.alert("Failed to load user preferences. Please try again.");
          }
        } else {
          clearPreferences();
          setIsLoggedIn(false);
          setIsGuest(false);
        }
      });
    };

    checkUserLoggedIn();
  }, [
    router,
    preferences,
    setPreferences,
    setIsLoggedIn,
    clearPreferences,
    setIsGuest,
  ]);

  console.log("LayoutWrapper rendered with preferences:", preferences);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
          clearPreferences();
          setIsLoggedIn(false);
          setIsGuest(false);
        } else {
          router.replace("/dashboard");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, clearPreferences, setIsLoggedIn, setIsGuest]);

  return <>{children}</>;
}
