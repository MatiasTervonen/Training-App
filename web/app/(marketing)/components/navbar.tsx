"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, CircleX } from "lucide-react";
import { useState, useRef } from "react";
import { useClickOutside } from "@/components/clickOutside";
import { useTranslation } from "react-i18next";

function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  return (
    <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden text-sm">
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-2.5 py-1 transition-colors cursor-pointer ${
          currentLang === "en"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage("fi")}
        className={`px-2.5 py-1 transition-colors cursor-pointer ${
          currentLang === "fi"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        FI
      </button>
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation("marketing");

  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <>
      <nav className="flex justify-between items-center px-5 py-3 text-gray-100">
        <div className="py-5">
          <Link href={"/"} className="flex items-center gap-3">
            <Image
              src="/app-logos/kurvi_icon_ice_blue_rounded.svg"
              alt="Kurvi icon"
              width={40}
              height={40}
            />
            <Image
              src="/app-logos/kurvi_ice_blue_final.svg"
              alt="Kurvi"
              width={180}
              height={49}
            />
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <LanguageToggle />
          <Link href={"/login"}>
            <button className="w-[250px] text-white bg-gradient-to-tr from-slate-950 to-blue-700 px-5 py-2 rounded-xl border-[1.5px] border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200 cursor-pointer text-nowrap">
              {t("navbar.login")}
            </button>
          </Link>
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
                ref={menuRef}
                className="absolute left-1/2 -translate-x-1/2 top-20 w-full bg-slate-950 p-4 shadow-lg text-gray-100 z-50 border-y-2 border-blue-500"
              >
                <div className="flex flex-col items-center gap-4 my-5">
                  <LanguageToggle />
                  <Link href={"/login"}>
                    <button className="text-white bg-gradient-to-tr from-slate-950 to-blue-700 px-5 py-2 rounded-xl border-[1.5px] border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200">
                      {t("navbar.login")}
                    </button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
