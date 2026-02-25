"use client";

import MenuContext from "@/features/menu/components/MenuContext";
import LinkButton from "@/components/buttons/LinkButton";
import SignOutButton from "@/components/buttons/singOutButton";
import InstallAppClient from "@/features/menu/components/installAppClient";
import { ShieldUser, UserPen, ContactRound, Settings, MessageSquareMore } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MenuPage() {
  const { t } = useTranslation("menu");

  return (
    <div className="page-padding max-w-md mx-auto flex flex-col min-h-full justify-between">
      <div>
        <h1 className="text-2xl text-center mb-10">{t("menu.title")}</h1>
        <div className="flex flex-col gap-5">
          <LinkButton href={"/menu/friends"}>
            <p>{t("menu.friends")}</p>
            <ContactRound />
          </LinkButton>
          <LinkButton href={"/menu/profile"}>
            <p>{t("menu.profile")}</p>
            <UserPen />
          </LinkButton>
          <LinkButton href={"/menu/security"}>
            <p>{t("menu.security")}</p>
            <ShieldUser />
          </LinkButton>
          <MenuContext />
          <LinkButton href={"/menu/settings"}>
            <p>{t("menu.settings")}</p>
            <Settings />
          </LinkButton>
          <LinkButton href={"/menu/feedback"}>
            <p>{t("menu.feedback")}</p>
            <MessageSquareMore />
          </LinkButton>
        </div>

      </div>
      <div className="flex flex-col gap-5 items-center ">
        <InstallAppClient />
        <SignOutButton />
      </div>
    </div>
  );
}
