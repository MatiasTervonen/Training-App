import { useUserStore } from "@/lib/stores/useUserStore";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { fetchUserPreferences } from "@/api/settings/get-settings";

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  role?: string; // Optional role for guest users
}

type Store = {
  router: ReturnType<typeof useRouter>;
  logoutUser: () => void;
  loginUser: (prefs: UserPreferences, session: Session) => void;
};

const handleSessionChange = async (session: Session | null, store: Store) => {
  const { router, loginUser, logoutUser } = store;

  if (!session) {
    logoutUser();
    router.replace("/");
    return;
  }

  const preferences = useUserStore.getState().preferences;

  if (!preferences) {
    const data = await fetchUserPreferences(session);

    loginUser(data!, session);
    router.replace("/dashboard");
  }

  router.replace("/dashboard");
};

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoutUser = useUserStore((state) => state.logoutUser);

  const loginUser = useUserStore((state) => state.loginUser);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session, {
        router,
        loginUser,
        logoutUser,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        handleSessionChange(session, {
          router,
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
