"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import NotificationBell from "@/components/navbar/NotificationBell";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useRouter } from "next/navigation";
import ActiveSessionPopup from "@/components/activeSessionPopup";
import { useTranslation } from "react-i18next";
import { useTotalUnreadCount } from "@/features/chat/hooks/useTotalUnreadCount";

export default function Navbar() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const router = useRouter();

  const preferences = useUserStore((state) => state.preferences);
  const { data: unreadCount } = useTotalUnreadCount();

  const fullPage =
    pathname === "/admin/user-analytics" || pathname.startsWith("/admin/docs")
      ? "w-full"
      : "max-w-3xl";

  return (
    <div className={`w-full lg:max-w-[1600px] ${fullPage} sticky top-0 mx-auto z-50`}>
      <nav className="relative w-full flex items-center justify-between p-4 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 shadow-lg">
        {!["/dashboard", "/menu", "/sessions"].includes(pathname) && (
          <button
            onClick={() => router.back()}
            className="absolute left-60 xl:left-76 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            {t("navigation.back")}
          </button>
        )}
        <Link href="/dashboard">
          <Image
            src="/app-logos/kurvi_icon_ice_blue_rounded.svg"
            alt="Kurvi"
            width={40}
            height={40}
          />
        </Link>
        <div className="flex gap-3 items-center">
          <NotificationBell />
          <Link
            href={"/chat"}
            className="relative border-[1.5px] p-2 border-blue-500 rounded-full bg-gray-800"
          >
            <MessageCircle size={20} />
            {unreadCount != null && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <Link href={"/menu"}>
            <Image
              src={preferences?.profile_picture || "/default-avatar.png"}
              alt="Profile Picture"
              width={20}
              height={20}
              className="rounded-full border-[1.5px] border-blue-500 w-10 h-10 cursor-pointer"
            />
          </Link>
        </div>
      </nav>
      {["/dashboard", "/menu", "/sessions"].includes(pathname) && (
        <div className="flex gap-1.5 p-1 bg-slate-800 w-full lg:hidden">
          <Link
            href={"/menu"}
            className={`flex-1 py-1.5 px-3 rounded-md text-center text-sm ${
              pathname === "/menu"
                ? "bg-slate-700 text-cyan-400"
                : "text-gray-200 hover:bg-slate-700"
            }`}
          >
            {t("navbar.menu")}
          </Link>
          <Link
            href={"/dashboard"}
            className={`flex-1 py-1.5 px-3 rounded-md text-center text-sm ${
              pathname === "/dashboard"
                ? "bg-slate-700 text-cyan-400"
                : "text-gray-200 hover:bg-slate-700"
            }`}
          >
            {t("navbar.feed")}
          </Link>
          <button
            onClick={() => router.push("/sessions")}
            className={`flex-1 py-1.5 px-3 rounded-md text-center text-sm cursor-pointer ${
              pathname === "/sessions"
                ? "bg-slate-700 text-cyan-400"
                : "text-gray-200 hover:bg-slate-700"
            }`}
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
