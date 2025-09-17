import ModalPageWrapper from "@/app/(app)//components/modalPageWrapper";
import LinkButton from "../ui/LinkButton";


export default function TimerPage() {
  return (
    <ModalPageWrapper>
      <div className="p-5 h-full relative text-gray-100 max-w-md mx-auto">
        <h1 className="text-2xl text-center my-5 ">Timer</h1>
        <div className="flex flex-col gap-5 max-w-md mx-auto">
          <LinkButton href="/timer/empty-timer">Start empty Timer</LinkButton>
          <LinkButton href="/timer/create-timer">Create Timer</LinkButton>
          <LinkButton href="/timer/my-timers">My-Timers</LinkButton>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
