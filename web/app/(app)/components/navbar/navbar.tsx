"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import NotificationBell from "@/app/(app)/components/navbar/NotificationBell";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { useRouter } from "next/navigation";
import ActiveSessionPopup from "@/app/(app)/components/activeSessionPopup";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const router = useRouter();

  const preferences = useUserStore((state) => state.preferences);

  const fullPage =
    pathname === "/admin/user-analytics" || pathname.startsWith("/admin/docs")
      ? "w-full"
      : "max-w-3xl";

  return (
    <div className={`w-full lg:max-w-[1600px] ${fullPage} sticky top-0 mx-auto z-50`}>
      <nav className="w-full flex items-center justify-between p-4 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900">
        <Link href="/dashboard" className=" text-2xl sm:text-3xl">
          MyTrack
        </Link>
        <div className="flex gap-3 items-center">
          <NotificationBell />
          <Link
            href={"/chat"}
            className="border-2 p-2 border-blue-500 rounded-full bg-gray-800"
          >
            <MessageCircle size={20} />
          </Link>
          <Link href={"/menu"}>
            <Image
              src={preferences?.profile_picture || "/default-avatar.png"}
              alt="Profile Picture"
              width={20}
              height={20}
              className="rounded-full border-2 border-blue-500 w-10 h-10 cursor-pointer"
            />
          </Link>
        </div>
      </nav>
      {["/dashboard", "/menu", "/sessions"].includes(pathname) && (
        <div className="flex justify-between bg-slate-600 w-full text-center text-gray-100 lg:hidden">
          <Link
            href={"/menu"}
            className={
              pathname === "/menu"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            {t("navbar.menu")}
          </Link>

          <Link
            href={"/dashboard"}
            className={
              pathname === "/dashboard"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            {t("navbar.feed")}
          </Link>
          <button
            onClick={() => router.push("/sessions")}
            className={
              pathname === "/sessions"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            {t("navbar.sessions")}
          </button>
        </div>
      )}
      <div className="lg:hidden">
        <ActiveSessionPopup />
      </div>
    </div>
  );
}
