import MenuContext from "./components/MenuContext";
import LinkButton from "../ui/LinkButton";
import SignOutButton from "../ui/singOutButton";
import InstallAppClient from "./components/installAppClient";
import { PushNotificationManager } from "../components/pushnotifications/pushnotifications";
import { ShieldUser, UserPen, ContactRound } from "lucide-react";

export default function MenuPage() {
  return (
    <div className="h-full bg-slate-800 text-primary px-5 pt-10 max-w-md mx-auto  flex flex-col justify-between">
      <div>
        <h1 className="text-2xl text-center mb-10 text-primary">Menu</h1>
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
        </div>
        <div className="mb-10">
          <PushNotificationManager />
        </div>
      </div>
      <div className="flex flex-col gap-5 items-center pb-20">
        <InstallAppClient />
        <SignOutButton />
      </div>
    </div>
  );
}
