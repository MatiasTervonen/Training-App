"use client";

import { russoOne } from "../../ui/fonts";
import ModalPageWrapper from "../components/modalPageWrapper";
import MenuContext from "./components/MenuContext";
import LinkButton from "../ui/LinkButton";
import SignOutButton from "../ui/singOutButton";
import { useState } from "react";

export default function MenuPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <ModalPageWrapper>
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100  px-5 pt-10`}
      >
        <h1 className="text-2xl text-center mb-5">Menu</h1>
        <div className="flex flex-col justify-between h-[calc(100vh-320px)]  max-w-md mx-auto ">
          <div>
            <LinkButton href={"/settings"}>Settings</LinkButton>
            <MenuContext />
          </div>
          <div className="">
            <SignOutButton onSignOut={() => setIsSigningOut(true)} />
          </div>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
