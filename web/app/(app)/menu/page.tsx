import MenuContext from "./components/MenuContext";
import LinkButton from "../ui/LinkButton";
import SignOutButton from "../ui/singOutButton";
import InstallAppClient from "./components/installAppClient";
import { PushNotificationManager } from "../components/pushnotifications/pushnotifications";

export default function MenuPage() {
  return (
    <div className="h-full bg-slate-800 text-primary px-5 pt-10 max-w-md mx-auto flex flex-col justify-between">
      <div>
        <h1 className="text-2xl text-center mb-10 text-primary">Menu</h1>
        <div className="flex flex-col gap-5">
          <LinkButton href={"/menu/friends"}>Friends</LinkButton>
          <LinkButton href={"/menu/profile"}>Profile</LinkButton>
          <MenuContext />
          <PushNotificationManager />
        </div>
      </div>
      <div className="flex flex-col gap-5 pb-10 items-center">
        <InstallAppClient />
        <SignOutButton />
      </div>
    </div>
  );
}
