import LinkButton from "../(app)/ui/LinkButton";

export default function ErrorPage() {
  return (
    <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 text-gray-100 text-lg px-2">
      <div className="flex flex-col items-center justify-center gap-10 max-w-xl border-2 py-10 px-5 sm:px-10 rounded-xl bg-slate-900 shadow-lg">
        <h1 className="text-2xl ">MyTrack</h1>
        <h2 className="text-red-400">This Link is No Longer Valid</h2>
        <p className="text-center">
          This link is no longer valid. If you&apos;ve already verified your
          email, you can log in now.
        </p>
        <div className="flex flex-col gap-5 w-full justify-center">
          <LinkButton href="/login">Log in</LinkButton>
          <LinkButton href="/">Go Home</LinkButton>
        </div>
      </div>
    </div>
  );
}
