"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/app/(app)/components/navbar/navbar";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const loginUser = useUserStore((state) => state.loginUser);

  const loginPage = pathname === "/login";

  useEffect(() => {
    if (loginPage) return;

    const preferences = useUserStore.getState().preferences;

    if (preferences) return;

    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/settings/get-settings");

        if (!response.ok) {
          throw new Error("Failed to fetch user preferences");
        }

        const data = await response.json();

        loginUser(data, data.role);
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        toast.error("Failed to load user preferences. Please try again.");
      }
    };

    fetchPreferences();
  }, [loginUser, loginPage]);

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <main className={`${loginPage ? "pt-0" : "pt-[72px]"}`}>{children}</main>
    </>
  );
}
