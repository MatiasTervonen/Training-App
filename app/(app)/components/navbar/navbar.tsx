"use client";

import { useState } from "react";
import { russoOne } from "@/app/ui/fonts";
import Link from "next/link";
import SignOutButton from "@/app/(app)/ui/singOutButton";
import { usePathname } from "next/navigation";
import {
  Settings,
  Menu,
  CircleX,
  NotebookPen,
  CalendarDays,
  MessageCircle,
} from "lucide-react";
import { useClickOutside } from "@/app/(app)/components/clickOutside";
import { useRef } from "react";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import Image from "next/image";
import NotificationBell from "@/app/(app)/components/navbar/components/NotificationBell";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const pathname = usePathname();

  const profilePictureRaw = useUserStore(
    (state) => state.preferences?.profile_picture || null
  );

  const cacheBustedPicture = profilePictureRaw
    ? `${profilePictureRaw}?t=${Date.now()}`
    : "/default-avatar.png";

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(menuRef, () => {
    if (!isSigningOut) setIsOpen(false);
  });

  if (pathname === "/login" || pathname === "/") return null; // Don't render the navbar on the login page

  return (
    <div className="relative w-full md:max-w-3xl mx-auto">
      <nav className="w-full flex items-center justify-between p-4 bg-slate-950">
        <Link
          href="/dashboard"
          className={`${russoOne.className} text-gray-100  text-3xl `}
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
              src={cacheBustedPicture}
              alt="Profile Picture"
              width={40}
              height={40}
              className="rounded-full border-2 border-blue-500 w-[40px] h-[40px] cursor-pointer"
            />
          </Link>
          <button
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={toggleMenu}
          >
            {isOpen ? (
              <CircleX className="text-gray-100" size={40} />
            ) : (
              <Menu className="text-gray-100" size={40} />
            )}
          </button>
        </div>
        {isOpen && (
          <div
            ref={menuRef}
            className="w-full bg-slate-950 p-4 absolute top-18 left-0 shadow-lg  text-gray-100 z-50 border-y-2 border-blue-500 "
          >
            <div className="flex flex-col items-center justify-center gap-4 mt-5 ">
              <Link
                href="/sessions"
                onClick={toggleMenu}
                className={`${russoOne.className} bg-blue-800 py-2  mb-5 px-22 text-center rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
              >
                Start session
              </Link>
              <div className="flex flex-col gap-4 mx-4">
                <div className="flex gap-4">
                  <Link
                    href="/calendar"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95`}
                  >
                    <CalendarDays />
                    Calendar
                  </Link>
                  <Link
                    href="/notes"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95`}
                  >
                    <NotebookPen />
                    Add Notes
                  </Link>
                </div>
                <div className="flex gap-4">
                  <Link
                    href="/settings"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95`}
                  >
                    <Settings />
                    Settings
                  </Link>
                  <Link
                    href="/notes"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95 `}
                  >
                    <NotebookPen />
                    Example
                  </Link>
                </div>
              </div>
              <div className="mx-auto mt-5 mr-0">
                <SignOutButton onSignOut={() => setIsSigningOut(true)} />
              </div>
            </div>
          </div>
        )}
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
