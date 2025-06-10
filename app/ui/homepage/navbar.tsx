"use client";

import { useState } from "react";
import { russoOne } from "@/app/ui/fonts";
import Link from "next/link";
import SignOutButton from "@/app/ui/singOutButton";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Settings,
  ArrowLeft,
  Menu,
  CircleX,
  NotebookPen,
  CalendarDays,
} from "lucide-react";
import { useClickOutside } from "@/app/components/clickOutside";
import { useRef } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(menuRef, () => {
    if (!isSigningOut) setIsOpen(false);
  });

  if (pathname === "/login") return null; // Don't render the navbar on the login page

  return (
    <div className="relative w-full md:max-w-3xl mx-auto">
      <nav className="w-full flex items-center justify-between p-4 bg-slate-950">
        <Link
          href="/"
          className={`${russoOne.className} text-gray-100  text-3xl `}
        >
          MyTrack
        </Link>

        {pathname !== "/" && (
          <button
            aria-label="Go back"
            onClick={handleBack}
            className="border-2 border-gray-100 bg-blue-950 w-fit p-1 rounded-md cursor-pointer"
          >
            <ArrowLeft className="text-white" />
          </button>
        )}

        <div className="flex">
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
      {["/", "/notes", "/sessions"].includes(pathname) && (
        <div
          className={`${russoOne.className} flex justify-between bg-slate-600 w-full text-center text-gray-100 z-0 `}
        >
          <Link
            href={"/notes"}
            className={
              pathname === "/notes"
                ? "bg-slate-500 p-2 w-1/3"
                : "p-2 w-1/3 hover:bg-slate-500"
            }
          >
            Notes
          </Link>

          <Link
            href={"/"}
            className={
              pathname === "/"
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
