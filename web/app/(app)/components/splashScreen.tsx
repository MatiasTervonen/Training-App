import Image from "next/image";

export default function SplashScreen() {
  return (
    <div className="flex flex-col gap-10 h-[100dvh] items-center justify-center bg-slate-800">
      <Image
        src="/android-chrome-512x512.png"
        alt="Logo"
        width={150}
        height={150}
        className="animate-pulse"
        priority
      />
      <p className="mt-4 text-gray-100 text-4xl">MyTrack</p>
    </div>
  );
}
