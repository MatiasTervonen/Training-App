"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChatButton() {
  const { t } = useTranslation("common");
  const pathname = usePathname();

  if (pathname === "/login") return null; // Prevent rendering on login page

  return (
    <div className="fixed bottom-4 right-4 bg-indigo-600/80 hover:bg-indigo-700 backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-100 z-1000">
      <Link href={"/chat"} className="flex items-center gap-2 text-gray-100">
        <MessageCircle size={24} />
        {t("common.chat")}
      </Link>
    </div>
  );
}
