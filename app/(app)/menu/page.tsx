import { russoOne } from "../../ui/fonts";
import ModalPageWrapper from "../components/modalPageWrapper";
import MenuContext from "./components/MenuContext";
import LinkButton from "../ui/LinkButton";

export default function MenuPage() {
  return (
    <ModalPageWrapper>
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100  px-5 pt-10`}
      >
        <h1 className="text-2xl text-center mb-5">Menu</h1>
        <div className="flex flex-col max-w-md mx-auto ">
          <LinkButton href={"/settings"}>Settings</LinkButton>
          <MenuContext />
        </div>
      </div>
    </ModalPageWrapper>
  );
}
