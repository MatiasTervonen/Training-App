import MenuContext from "./components/MenuContext";
import LinkButton from "../components/buttons/LinkButton";
import SignOutButton from "../components/buttons/singOutButton";
import InstallAppClient from "./components/installAppClient";
import { ShieldUser, UserPen, ContactRound, Settings } from "lucide-react";

export default function MenuPage() {
  return (
    <div className="page-padding max-w-md mx-auto flex flex-col min-h-full justify-between">
      <div>
        <h1 className="text-2xl text-center mb-10">Menu</h1>
        <div className="flex flex-col gap-5">
          <LinkButton href={"/menu/friends"}>
            <p>Friends</p>
            <ContactRound />
          </LinkButton>
          <LinkButton href={"/menu/profile"}>
            <p>Profile</p>
            <UserPen />
          </LinkButton>
          <LinkButton href={"/menu/security"}>
            <p>Security</p>
            <ShieldUser />
          </LinkButton>
          <MenuContext />
          <LinkButton href={"/menu/settings"}>
            <p>Settings</p>
            <Settings />
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
