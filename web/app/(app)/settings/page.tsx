import { russoOne } from "../../ui/fonts";
import { UserRoundPen, Contact } from "lucide-react";
import ModalPageWrapper from "../components/modalPageWrapper";
import LinkButton from "../ui/LinkButton";

export default function Settings() {
  return (
    <ModalPageWrapper noTopPadding>
      <div className="p-5 h-full">
        <h1
          className={`${russoOne.className} text-gray-100 text-center  my-5 text-2xl `}
        >
          Settings
        </h1>
        <div className="flex flex-col max-w-md mx-auto">
          <LinkButton href="/settings/profile">
            Profile
            <UserRoundPen />
          </LinkButton>
          <LinkButton href="/settings/friends">
            Friends
            <Contact />
          </LinkButton>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
