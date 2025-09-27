import LinkButton from "../(app)/ui/LinkButton";

export default function EmailVerified() {
  return (
    <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 text-gray-100 text-lg px-2">
      <div className="flex flex-col items-center justify-center gap-10 max-w-xl border-2 py-10 px-5 sm:px-10 rounded-xl bg-slate-900 shadow-lg">
        <h1 className="text-2xl ">MyTrack</h1>
        <h2 className="text-green-400">Email Verified Successfully</h2>
        <p className="text-center">
          Your email has been successfully verified. You can now log in to your
          account.
        </p>
        <LinkButton href="/login">Log in</LinkButton>
      </div>
    </div>
  );
}
