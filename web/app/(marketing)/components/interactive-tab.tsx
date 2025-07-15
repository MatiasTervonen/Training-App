"use client";

import { useState } from "react";
import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Scale,
  ChartArea,
} from "lucide-react";
import DiscGolf from "./disc-golf";
import Notes from "./notes";
import Weight from "./weight";
import Gym from "./gym";

export default function InteractiveTab() {
  const [activeSection, setActiveSection] = useState("gym");

  return (
    <>
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
    </>
  );
}
