import ModalPageWrapper from "../components/modalPageWrapper";
import MenuContext from "./components/MenuContext";
import LinkButton from "../ui/LinkButton";
import SignOutButton from "../ui/singOutButton";

export default function MenuPage() {
  return (
    <ModalPageWrapper>
      <div className="h-full bg-slate-800 text-primary px-5 pt-10 max-w-md mx-auto flex flex-col justify-between">
        <div>
          <h1 className="text-2xl text-center mb-10 text-primary">Menu</h1>
          <div className="flex flex-col gap-5">
            <LinkButton href={"/menu/friends"}>Friends</LinkButton>
            <LinkButton href={"/menu/profile"}>Profile</LinkButton>
            <MenuContext />
          </div>
        </div>
        <div className="pb-10">
          <SignOutButton />
        </div>
      </div>
    </ModalPageWrapper>
  );
}
