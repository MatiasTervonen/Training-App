import Image from "next/image";
import Navbar from "./components/navbar";
import InteractiveTab from "./components/interactive-tab";

export default function Home() {
  return (
    <div className="bg-slate-950 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        <Navbar />

        <div className="flex flex-col  justify-center items-center gap-10  text-gray-100 py-10 lg:py-20 bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 rounded-t-xl px-5">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-center">
              Welcome to the{" "}
              <span className="px-4 w-fit rounded-md text-left bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                MyTrack!
              </span>
            </h1>
            <p className="text-md text-gray-100 rounded-md py-2 sm:text-xl text-center">
              The Only Tracking App You&apos;ll Ever Need
            </p>
          </div>
          <div className="flex flex-col items-center gap-10 lg:flex-row text-center ">
            <div className="flex flex-col">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl mb-4">
                  Track Your Progress
                </h2>
                <p className="text-md sm:text-lg mt-4 max-w-lg ">
                  Track everything from gym workouts to Disc Golf rounds and
                  personal goals. MyTrack helps you stay organized and motivated
                  your progress, your way.
                </p>
              </div>
            </div>
            <div>
              <Image
                src="/feed.webp"
                alt="Landing Image"
                width={300}
                height={608}
                priority
              />
            </div>
          </div>
        </div>
        <InteractiveTab />
      </div>
    </div>
  );
}
