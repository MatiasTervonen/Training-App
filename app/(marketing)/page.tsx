"use client";

import { russoOne } from "../ui/fonts";
import Image from "next/image";
import Link from "next/link";
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

export default function Home() {
  const [activeSection, setActiveSection] = useState("gym");

  return (
    <div className={`${russoOne.className} bg-slate-950 h-full`}>
      <div className="max-w-7xl mx-auto">
        <nav className="flex justify-between items-center px-5 py-3 text-gray-100">
          <div className="text-2xl py-5">
            <Link href={"/"}>MyTrack</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href={"/login"}>
              <button
                className={`${russoOne.className}  text-gray-100 font-bold border-2 border-blue-500 p-2 rounded-xl bg-blue-900 hover:bg-blue-800 hover:scale-95 cursor-pointer`}
              >
                Log in / Sign up
              </button>
            </Link>
            <div className="bg-slate-700 py-2 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-600 hover:scale-95 cursor-pointer">
              <p>Download app</p>
            </div>
          </div>
        </nav>
        <div className="flex flex-col lg:flex-row justify-center items-center gap-20 text-gray-100 py-10 lg:py-30 bg-slate-950 px-5">
          <div className="flex flex-col text-center">
            <div className="flex flex-col items-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl">
                Welcome to the MyTrack!
              </h1>
              <p className="text-md sm:text-lg mt-4">
                The Only Tracking App You&apos;ll Ever Need
              </p>
            </div>
            <div className="mt-10 flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl mb-4">Track Your Progress</h2>
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
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>
        <div className="flex flex-row justify-center px-4 gap-1 flex-wrap md:gap-4 lg:gap-16 text-gray-100 py-5 text-lg bg-slate-900">
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

        <div className="mt-10">
          {activeSection === "gym" && <Gym />}
          {activeSection === "disc-golf" && <DiscGolf />}
          {activeSection === "notes" && <Notes />}
          {activeSection === "weight" && <Weight />}
        </div>
      </div>
    </div>
  );
}
