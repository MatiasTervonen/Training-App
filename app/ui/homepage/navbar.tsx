"use client";

import { useState } from "react";
import { russoOne } from "@/app/ui/fonts";
import Image from "next/image";
import Link from "next/link";
import SignOutButton from "@/app/ui/singOutButton";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Settings, ArrowLeft } from "lucide-react";
import { useClickOutside } from "@/app/components/clickOutside";
import { useRef } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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
  useClickOutside(menuRef, () => setIsOpen(false));

  if (pathname === "/login") return null; // Don't render the navbar on the login page

  return (
    <div className="relative w-full md:max-w-3xl mx-auto">
      <nav className="w-full flex items-center justify-between p-4 bg-slate-950">
        <Link
          href="/"
          className={`${russoOne.className} text-gray-100 font-bold text-3xl `}
        >
          MyTrack
        </Link>

        {pathname !== "/" && (
          <button
            onClick={handleBack}
            className="border-2 border-gray-100 bg-blue-950 w-fit p-1 rounded-md cursor-pointer"
          >
            <ArrowLeft className="text-white" />
          </button>
        )}

        <div className="flex">
          <button onClick={toggleMenu}>
            {isOpen ? (
              <Image
                src="/Close.png"
                alt="Close menu"
                width={40}
                height={40}
                className="hover:cursor-pointer "
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-10 text-gray-100"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6 "
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                      />
                    </svg>
                    Calendar
                  </Link>
                  <Link
                    href="/notes"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="size-6 "
                    >
                      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                      <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="size-6 "
                    >
                      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                      <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                    </svg>
                    Example
                  </Link>
                </div>
              </div>
              <div className="mx-auto mt-5 mr-0">
                <SignOutButton onSignOut={() => setIsOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </nav>
      {["/", "/notes", "/sessions"].includes(pathname) && (
        <div
          className={`${russoOne.className} flex justify-between bg-slate-600 w-full text-center text-gray-100 z-0 `}
        >
          <h2
            className={
              pathname === "/notes" ? "bg-blue-950/50 p-2 w-1/3" : "p-2 w-1/3"
            }
          >
            Notes
          </h2>

          <h2
            className={pathname === "/" ? "bg-blue-950/50 p-2 w-1/3" : "p-2 w-1/3"}
          >
            Feed
          </h2>
          <h2
            className={
              pathname === "/sessions" ? "bg-blue-950/50 p-2 w-1/3" : "p-2 w-1/3"
            }
          >
            Sessions
          </h2>
        </div>
      )}
    </div>
  );
}
