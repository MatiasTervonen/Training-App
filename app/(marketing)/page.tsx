"use client";

import { russoOne } from "../ui/fonts";
import Image from "next/image";
import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Scale,
  ChartArea,
} from "lucide-react";
import Gym from "./components/gym";
import DiscGolf from "./components/disc-golf";
import { useState } from "react";
import Notes from "./components/notes";
import Weight from "./components/weight";
import Navbar from "./components/navbar";

export default function Home() {
  const [activeSection, setActiveSection] = useState("gym");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${russoOne.className} bg-slate-950 min-h-screen relative`}>
      <div className="max-w-7xl mx-auto">
        <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />

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
            <div className="">
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

        <div className="flex flex-row justify-center px-4 flex-wrap md:gap-x-4 lg:gap-x-10 text-gray-100 py-5 text-lg bg-slate-900 rounded-xl">
          <div
            onClick={() => setActiveSection("gym")}
            className={`flex items-center gap-2 px-4 py-2 ${
              activeSection === "gym"
                ? "text-blue-500 bg-gray-800 rounded-2xl"
                : ""
            } cursor-pointer`}
          >
            <Dumbbell />
            <p>Gym</p>
          </div>
          <div
            onClick={() => setActiveSection("disc-golf")}
            className={`flex items-center gap-2 px-4 py-2 ${
              activeSection === "disc-golf"
                ? "text-blue-500 bg-gray-800 py-2 px-4 rounded-2xl"
                : ""
            } cursor-pointer`}
          >
            <Disc />
            <p>Disc-Golf</p>
          </div>
          <div
            onClick={() => setActiveSection("notes")}
            className={`flex items-center gap-2 px-4 py-2 ${
              activeSection === "notes"
                ? "text-blue-500 bg-gray-800 py-2 px-4 rounded-2xl"
                : ""
            } cursor-pointer`}
          >
            <NotebookPen />
            <p>Notes</p>
          </div>
          <div
            onClick={() => setActiveSection("weight")}
            className={`flex items-center gap-2 px-4 py-2 ${
              activeSection === "weight"
                ? "text-blue-500 bg-gray-800 py-2 px-4 rounded-2xl"
                : ""
            } cursor-pointer`}
          >
            <Scale />
            <p>Weight</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <Timer />
            <p>Timer</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <ChartArea />
            <p>Analytics</p>
          </div>
        </div>

        <div className="sm:mt-10 ">
          {activeSection === "gym" && <Gym />}
          {activeSection === "disc-golf" && <DiscGolf />}
          {activeSection === "notes" && <Notes />}
          {activeSection === "weight" && <Weight />}
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-xs z-10 pointer-events-none"></div>
      )}
    </div>
  );
}
