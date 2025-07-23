"use client";

import { russoOne } from "@/app/ui/fonts";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import Image from "next/image";
import NotificationBell from "@/app/(app)/components/navbar/components/NotificationBell";

export default function Navbar() {
  const pathname = usePathname();

  const profilePictureRaw = useUserStore(
    (state) => state.preferences?.profile_picture || null
  );

  if (pathname === "/login" || pathname === "/") return null; // Don't render the navbar on the login page

  return (
    <div className="relative w-full md:max-w-3xl mx-auto">
      <nav className="w-full flex items-center justify-between p-4 bg-slate-950">
        <Link
          href="/dashboard"
          className={`${russoOne.className} text-gray-100 text-2xl sm:text-3xl`}
        >
          MyTrack
        </Link>
        <div className="flex gap-3 items-center">
          <NotificationBell />
          <Link
            href={"/chat"}
            className="text-gray-100 border-2 p-2 border-blue-500 rounded-full bg-gray-800"
          >
            <MessageCircle size={20} />
          </Link>
          <Link href={"/settings"}>
            <Image
              src={profilePictureRaw || "/default-avatar.png"}
              alt="Profile Picture"
              width={20}
              height={20}
              className="rounded-full border-2 border-blue-500 w-[40px] h-[40px] cursor-pointer"
            />
          </Link>
        </div>
      </nav>
      {["/dashboard", "/menu", "/sessions"].includes(pathname) && (
        <div
          className={`${russoOne.className} flex justify-between bg-slate-600 w-full text-center text-gray-100 z-0 `}
        >
          <Link
            href={"/menu"}
            className={
              pathname === "/menu"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            Menu
          </Link>

          <Link
            href={"/dashboard"}
            className={
              pathname === "/dashboard"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            Feed
          </Link>
          <Link
            href={"/sessions"}
            className={
              pathname === "/sessions"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            Sessions
          </Link>
        </div>
      )}
    </div>
  );
}
