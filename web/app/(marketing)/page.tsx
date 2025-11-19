import Image from "next/image";
import Navbar from "./components/navbar";
import InteractiveTab from "./components/interactive-tab";
import AnimatedH1 from "./components/AnimatedH1";
import Footer from "./components/footer";

export default function Home() {
  return (
    <div className="bg-slate-950 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        <header>
          <Navbar />
        </header>

        <main className="flex flex-col  justify-center items-center gap-10 text-gray-100 py-10 lg:py-20 bg-linear-to-tr from-slate-950 via-slate-950 to-blue-900 rounded-t-xl px-5">
          <section>
            <AnimatedH1 />
            <p className="text-md text-gray-100 rounded-md py-2 sm:text-xl text-center">
              The Only Tracking App You&apos;ll Ever Need
            </p>
          </section>
          <section className="flex flex-col items-center gap-10 lg:flex-row text-center ">
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
          </section>
        </main>
        <section>
          <InteractiveTab />
        </section>
      </div>
      <Footer />
    </div>
  );
}
