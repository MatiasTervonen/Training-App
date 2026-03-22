"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("marketing-lang", lng);
  };

  return (
    <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden text-sm">
      <button
        onClick={() => switchLang("en")}
        className={`px-2.5 py-1 transition-colors cursor-pointer ${
          currentLang === "en"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLang("fi")}
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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <nav className="flex justify-between items-center px-5 py-2 text-gray-100">
        <div className="py-2 sm:py-4">
          <Link href={"/"} className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/app-logos/kurvi_icon_ice_blue_rounded.svg"
              alt="Kurvi icon"
              width={32}
              height={32}
              className="sm:w-10 sm:h-10"
            />
            <Image
              src="/app-logos/kurvi_ice_blue_final.svg"
              alt="Kurvi"
              width={140}
              height={38}
              className="sm:w-[180px]"
            />
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <LanguageToggle />
          {/* Login button hidden — web app not fully ready yet */}
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(true)}>
            <Menu className="text-gray-100" size={32} />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-5 right-5 top-14 z-50 bg-slate-900 border-[1.5px] border-slate-600 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] py-16 px-8 flex flex-col items-center gap-8">
                <LanguageToggle />
                {/* Login button hidden — web app not fully ready yet */}
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
