import LinkButton from "../ui/LinkButton";

export default function TimerPage() {
  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="text-2xl text-center mb-10">Timer</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href="/timer/empty-timer">Start empty Timer</LinkButton>
        <LinkButton href="/timer/create-timer">Create Timer</LinkButton>
        <LinkButton href="/timer/my-timers">My-Timers</LinkButton>
      </div>
    </div>
  );
}
