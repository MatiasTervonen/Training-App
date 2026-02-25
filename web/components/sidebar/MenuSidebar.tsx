"use client";

import LinkButton from "@/components/buttons/LinkButton";
import MenuContext from "@/features/menu/components/MenuContext";
import SignOutButton from "@/components/buttons/singOutButton";
import { ShieldUser, UserPen, ContactRound, Settings, MessageSquareMore } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MenuSidebar() {
  const { t } = useTranslation("menu");

  return (
    <div className="flex flex-col justify-between h-full px-6 py-4">
      <div>
        <h2 className="text-xl text-center mb-6">{t("menu.title")}</h2>
        <div className="flex flex-col gap-3">
          <LinkButton href="/menu/friends">
            <p>{t("menu.friends")}</p>
            <ContactRound size={18} />
          </LinkButton>
          <LinkButton href="/menu/profile">
            <p>{t("menu.profile")}</p>
            <UserPen size={18} />
          </LinkButton>
          <LinkButton href="/menu/security">
            <p>{t("menu.security")}</p>
            <ShieldUser size={18} />
          </LinkButton>
          <MenuContext />
          <LinkButton href="/menu/settings">
            <p>{t("menu.settings")}</p>
            <Settings size={18} />
          </LinkButton>
          <LinkButton href="/menu/feedback">
            <p>{t("menu.feedback")}</p>
            <MessageSquareMore size={18} />
          </LinkButton>
        </div>
      </div>
      <div className="flex flex-col gap-3 items-center">
        <SignOutButton />
      </div>
    </div>
  );
}
