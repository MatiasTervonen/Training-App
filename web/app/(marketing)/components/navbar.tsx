"use client";

import Link from "next/link";
import InstallApp from "@/app/(app)/components/installApp";
import { Menu, CircleX } from "lucide-react";
import { useState, useRef } from "react";
import { useClickOutside } from "@/app/(app)/components/clickOutside";
import { useInstallPrompt } from "@/app/(app)/lib/useInstallPrompt";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const installRef = useRef<HTMLDivElement>(null);

  useClickOutside(installRef, () => setIsOpen(false));

  const promptEvent = useInstallPrompt();

  return (
    <>
      <nav className="flex justify-between items-center px-5 py-3 text-gray-100">
        <div className="text-3xl py-5">
          <Link href={"/"}>MyTrack</Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link href={"/login"}>
            <button className="w-[183px] text-white bg-gradient-to-tr from-slate-950  to-blue-700 px-5 py-2 rounded-xl border-2 border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200">
              Log in / Sign up
            </button>
          </Link>
          <div>
            <InstallApp promptEvent={promptEvent} />
          </div>
        </div>
        <div className="md:hidden">
          <div className="relative w-10 h-10">
            <button
              onClick={() => setIsOpen(true)}
              className={`absolute inset-0 ${isOpen ? "hidden" : "block"}`}
            >
              <Menu className="text-gray-100" size={40} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className={`absolute inset-0 z-50 ${isOpen ? "block" : "hidden"}`}
            >
              <CircleX className="text-gray-100" size={40} />
            </button>
          </div>
          {isOpen && (
            <>
              <div className="absolute inset-0  backdrop-blur-sm" />
              <div
                ref={installRef}
                className="absolute left-1/2 -translate-x-1/2 top-20 w-full bg-slate-950 p-4 shadow-lg text-gray-100 z-50 border-y-2 border-blue-500 ba"
              >
                <div className="flex flex-col items-center gap-4 my-5">
                  <Link href={"/login"}>
                    <button className="w-[183px] text-white bg-gradient-to-tr from-slate-950  to-blue-700 px-5 py-2 rounded-xl border-2 border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200">
                      Log in / Sign up
                    </button>
                  </Link>
                  <div>
                    <InstallApp promptEvent={promptEvent} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
