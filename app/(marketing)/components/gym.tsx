"use client";

import Image from "next/image";

export default function Gym() {
  return (
    <div className="text-gray-100  pb-20">
      <h2 className="text-3xl sm:text-4xl text-center pt-10">
        Gym workouts
      </h2>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-20 pt-10 px-5">
        <div className="flex flex-col  max-w-lg bg-slate-900 py-4 px-6 rounded-lg shadow-lg ">
          <p className="text-center rounded-xl lg:text-left text-md sm:text-lg">
            Track your gym workouts, sets, reps, and personal records. MyTrack
            helps you stay organized and motivated in your fitness journey.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <p>- Start empty workouts</p>
            <p>- Create custom workouts</p>
            <p>- Track progress over time</p>
            <p>- See history for every exercise</p>
            <p>- Set personal goals</p>
          </div>
        </div>
        <div>
          <Image
            src="/gym_empty_workout-portrait.png"
            alt="Gym Image"
            width={300}
            height={300}
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
