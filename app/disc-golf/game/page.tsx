"use client";

import { russoOne } from "@/app/ui/fonts";
import Timer from "@/app/components/timer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteSessionBtn from "@/app/ui/deleteSessionBtn";

type HoleData = {
  hole_number: number;
  length: number;
  par: number;
  scores: {
    playerName: string;
    strokes: number;
    fairwayHit: boolean;
    c1made: boolean;
    c2made: boolean;
  }[];
};

type Player = {
  name: string;
  is_guest: boolean;
};

export default function DiscGolfGame() {
  const [hole, setHole] = useState(1);
  const [length, setLength] = useState(""); // input value
  const [par, setPar] = useState(3); // input value
  const [courseName, setCourseName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<{
    [playerName: string]: {
      strokes?: number;
      fairwayHit: boolean;
      c1made: boolean;
      c1attempted: boolean;
      c2made: boolean;
      c2attempted: boolean;
    };
  }>({});
  const [trackStats, setTrackStats] = useState(false);
  const router = useRouter();
  const [totalHoles, setTotalHoles] = useState<number>(18); // default fallback

  useEffect(() => {
    const setup = localStorage.getItem("setupData");
    const currentHole = localStorage.getItem("currentHole");
    const trackStats = localStorage.getItem("trackStats");
    const numHoles = localStorage.getItem("numHoles");

    if (setup) {
      const { courseName, players } = JSON.parse(setup);
      setCourseName(courseName);
      setPlayers(players);
    }

    if (currentHole) {
      setHole(parseInt(currentHole));
    }

    if (trackStats) {
      setTrackStats(JSON.parse(trackStats));
    }

    if (numHoles) {
      setTotalHoles(parseInt(numHoles));
    }
  }, []);

  const handleFinishGame = () => {
    const confirmed = confirm("Are you sure you want to finish the game?");
    if (!confirmed) return;

    const holeData: HoleData = {
      hole_number: hole,
      length: parseInt(length),
      par: par,
      scores: players.map((player) => ({
        playerName: player.name,
        strokes: playerStats[player.name]?.strokes ?? 0,
        fairwayHit: playerStats[player.name]?.fairwayHit ?? false,
        c1made: playerStats[player.name]?.c1made ?? false,
        c1attempted: playerStats[player.name]?.c1attempted ?? false,
        c2made: playerStats[player.name]?.c2made ?? false,
        c2attempted: playerStats[player.name]?.c2attempted ?? false,
      })),
    };

    // Save the hole data to local storage or send it to your backend
    const existingHoles = JSON.parse(
      localStorage.getItem("holes") || "[]"
    ) as HoleData[];

    localStorage.setItem("holes", JSON.stringify([...existingHoles, holeData]));

    const timer = JSON.parse(localStorage.getItem("timer:disc-golf") || "{}");

    let finalTime = 0;

    if (timer.isRunning && timer.startTime) {
      finalTime =
        Math.floor((Date.now() - timer.startTime) / 1000) +
        (timer.elapsedBeforePause || 0);
    } else {
      finalTime = timer.elapsedBeforePause || 0;
    }

    localStorage.setItem("finalTime", finalTime.toString());
    localStorage.setItem("gameFinished", "true");
    router.push("/disc-golf/game-finished");
  };

  const handleNextHole = () => {
    window.scrollTo(0, 0); // Scroll to top of the page
    const holeData: HoleData = {
      hole_number: hole,
      length: parseInt(length),
      par: par,
      scores: players.map((player) => ({
        playerName: player.name,
        strokes: playerStats[player.name]?.strokes ?? 0,
        fairwayHit: playerStats[player.name]?.fairwayHit ?? false,
        c1made: playerStats[player.name]?.c1made ?? false,
        c1attempted: playerStats[player.name]?.c1attempted ?? false,
        c2made: playerStats[player.name]?.c2made ?? false,
        c2attempted: playerStats[player.name]?.c2attempted ?? false,
      })),
    };

    // Save the hole data to local storage or send it to your backend
    const existingHoles = JSON.parse(
      localStorage.getItem("holes") || "[]"
    ) as HoleData[];

    const nextHole = hole + 1;

    localStorage.setItem("holes", JSON.stringify([...existingHoles, holeData]));

    localStorage.setItem("currentHole", JSON.stringify(nextHole));

    setHole(nextHole);
    setLength("");
    setPar(3);
    setPlayerStats(
      players.reduce<{
        [playerName: string]: {
          strokes: number;
          fairwayHit: boolean;
          c1made: boolean;
          c1attempted: boolean;
          c2made: boolean;
          c2attempted: boolean;
        };
      }>((acc, player) => {
        acc[player.name] = {
          strokes: 0,
          fairwayHit: false,
          c1made: false,
          c1attempted: false,
          c2made: false,
          c2attempted: false,
        };
        return acc;
      }, {})
    );
  };

  return (
    <div className="relative">
      <nav className="flex items-center justify-between bg-gray-700 p-2 px-4 sticky top-19 z-40">
        <div className="flex items-center justify-center gap-2  text-gray-100">
          <Timer sessionId="disc-golf" />
        </div>

        <Link
          href="/ui/disc-golf/score-summary"
          className={`${russoOne.className} text-gray-100`}
        >
          Live Scorecard
        </Link>
      </nav>

      <div className="bg-slate-800 p-5 min-h-[100dvh] relative">
        <h1
          className={`${russoOne.className} text-gray-100 flex justify-center my-2 text-2xl `}
        >
          Hole {hole}
        </h1>
        <p
          className={`${russoOne.className} text-gray-100 flex justify-center my-2  `}
        >
          {courseName}
        </p>
        <div className="border-2 border-gray-100 p-5 rounded-xl">
          {/* <div className="flex flex-col gap-2">
            <label className="">
              <p className={`${russoOne.className} text-gray-100 text-center`}>
                Length: {length} m
              </p>
              <input
                className="w-full px-5 border border-gray-400 h-2 my-5 appearance-none bg-gray-700 rounded-md 
                     [&::-webkit-slider-thumb]:appearance-none 
                     [&::-webkit-slider-thumb]:h-6 
                     [&::-webkit-slider-thumb]:w-6 
                    [&::-webkit-slider-thumb]:bg-green-400 
                     [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:cursor-pointer"
                type="range"
                min={40}
                max={300}
                placeholder={`Length...`}
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </label>
          </div> */}

          <label className="flex flex-col gap-2">
            <p className={`${russoOne.className} text-gray-100 text-center`}>
              Par: {par}
            </p>

            <input
              className="w-full px-5 border border-gray-400 h-2 my-5 appearance-none bg-gray-700 rounded-md 
                     [&::-webkit-slider-thumb]:appearance-none 
                     [&::-webkit-slider-thumb]:h-6 
                     [&::-webkit-slider-thumb]:w-6 
                    [&::-webkit-slider-thumb]:bg-green-400 
                     [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:cursor-pointer"
              type="range"
              min={3}
              max={5}
              step={1}
              placeholder={`Par...`}
              value={par}
              onChange={(e) => setPar(Number(e.target.value))}
            />
          </label>
        </div>
        {players.map((player, index) => (
          <div key={index} className="flex flex-col gap-2 mt-5">
            <label
              className={`${russoOne.className} text-gray-100 flex flex-col gap-2 items-center`}
            >
              {player.name} - Strokes: {playerStats[player.name]?.strokes ?? 0}
              <input
                className="w-full px-5 border border-gray-400 h-2 my-5 appearance-none bg-gray-700 rounded-md 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:h-6 
                [&::-webkit-slider-thumb]:w-6 
               [&::-webkit-slider-thumb]:bg-green-400 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer"
                type="range"
                min={0}
                max={12}
                step={1}
                placeholder="Strokes"
                value={playerStats[player.name]?.strokes ?? 0}
                onChange={(e) => {
                  const val = e.target.value;

                  setPlayerStats((prev) => ({
                    ...prev,
                    [player.name]: {
                      ...prev[player.name],
                      strokes: val === "" ? undefined : parseInt(val),
                    },
                  }));
                }}
              />
            </label>

            {trackStats && (
              <>
                <label className="text-gray-100 flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={playerStats[player.name]?.fairwayHit ?? false}
                    onChange={(e) =>
                      setPlayerStats((prev) => ({
                        ...prev,
                        [player.name]: {
                          ...prev[player.name],
                          fairwayHit: e.target.checked,
                        },
                      }))
                    }
                  />
                  Fairway Hit
                </label>
                <label className="text-gray-100 flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={playerStats[player.name]?.c1made ?? false}
                    onChange={(e) =>
                      setPlayerStats((prev) => ({
                        ...prev,
                        [player.name]: {
                          ...prev[player.name],
                          c1made: e.target.checked,
                          c1attempted: e.target.checked
                            ? true
                            : prev[player.name]?.c1attempted,
                        },
                      }))
                    }
                  />
                  C1 Made
                </label>
                <label className="text-gray-100 flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={playerStats[player.name]?.c1attempted ?? false}
                    onChange={(e) =>
                      setPlayerStats((prev) => ({
                        ...prev,
                        [player.name]: {
                          ...prev[player.name],
                          c1attempted: e.target.checked,
                          c1made: e.target.checked
                            ? prev[player.name]?.c1made
                            : false,
                        },
                      }))
                    }
                  />
                  C1 Attempted
                </label>
                <label className="text-gray-100 flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={playerStats[player.name]?.c2made ?? false}
                    onChange={(e) =>
                      setPlayerStats((prev) => ({
                        ...prev,
                        [player.name]: {
                          ...prev[player.name],
                          c2made: e.target.checked,
                          c2attempted: e.target.checked
                            ? true
                            : prev[player.name]?.c2attempted,
                        },
                      }))
                    }
                  />
                  C2 Made
                </label>
                <label className="text-gray-100 flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={playerStats[player.name]?.c2attempted ?? false}
                    onChange={(e) =>
                      setPlayerStats((prev) => ({
                        ...prev,
                        [player.name]: {
                          ...prev[player.name],
                          c2attempted: e.target.checked,
                          c2made: e.target.checked
                            ? prev[player.name]?.c2made
                            : false,
                        },
                      }))
                    }
                  />
                  C2 Attempted
                </label>
              </>
            )}
          </div>
        ))}

        <div className="mb-10">
          {hole < totalHoles && (
            <button
              onClick={handleNextHole}
              className={`${russoOne.className} mb-5 flex items-center justify-center w-full  bg-blue-800 py-2 px-10 mt-10 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
            >
              Next Hole
            </button>
          )}
          <button
            onClick={handleFinishGame}
            className={`${russoOne.className} mb-5 mt-10 flex items-center justify-center w-full  bg-blue-800 py-2 px-10  rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Finish
          </button>
          <DeleteSessionBtn
            storageKey={[
              "activeSession",
              "setupData",
              "startTime",
              "timer:disc-golf",
              "holes",
              "currentHole",
              "trackStats",
              "numHoles",
            ]}
            onDelete={() => router.push("/disc-golf")}
          />
        </div>
      </div>
    </div>
  );
}
