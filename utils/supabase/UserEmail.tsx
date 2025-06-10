"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const UserEmailContext = createContext<string | null>(null);

export function UserEmailProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email ?? null);
      }
    );

    // Cleanup the listener on unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserEmailContext.Provider value={email}>
      {children}
    </UserEmailContext.Provider>
  );
}

export function useUserEmail() {
  return useContext(UserEmailContext);
}
