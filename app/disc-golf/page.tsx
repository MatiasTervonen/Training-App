"use client";

import { russoOne } from "../ui/fonts";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import { createClient } from "@/utils/supabase/client";

export default function DiscGolf() {
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState<string>("");
  const [courseName, setCourseName] = useState("");
  const [trackStats, setTrackStats] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [numHoles, setNumHoles] = useState<number>(18); // Default to 18

  useEffect(() => {
    const fetchDisplayName = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user display name:", error.message);
      }

      const name = user?.user_metadata.display_name || "you";
      setUserDisplayName(name);
      setPlayers((prev) => {
        if (!prev.includes(name)) {
          return [name, ...prev];
        }
        return prev;
      });
    };

    fetchDisplayName();
  }, []);

  const addPlayer = () => {
    if (newPlayer.trim() !== "") {
      setPlayers((prev) => [...prev, newPlayer]);
      setNewPlayer("");
    }
  };

  function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  const startGame = () => {
    const randomizedPlayers = shuffleArray(players);

    const setupData = {
      courseName,
      sessionIsRunning: true,
      players: randomizedPlayers.map((p) => ({
        name: p,
        is_quest: p !== userDisplayName,
      })),
    };

    const now = Date.now();

    localStorage.setItem("setupData", JSON.stringify(setupData));

    localStorage.setItem("startTime", new Date().toISOString());

    localStorage.setItem("trackStats", JSON.stringify(trackStats));

    localStorage.setItem("numHoles", JSON.stringify(numHoles));

    localStorage.setItem(
      `timer:disc-golf`,
      JSON.stringify({
        startTime: now,
        elapsedBeforePause: 0,
        isRunning: true,
      })
    );

    localStorage.setItem(
      "activeSession",
      JSON.stringify({
        type: "disc-golf",
        label: `Disc Golf - ${courseName}`,
        startedAt: new Date().toISOString(),
        path: "/disc-golf/game",
      })
    );

    window.location.href = "/disc-golf/game";
  };

  const resetSessionState = () => {
    setPlayers([]);
    setNewPlayer("");
    setCourseName("");
    setTrackStats(false);
  };

  return (
    <div className="bg-slate-800 p-5 h-full">
      <div>
        <h1
          className={`${russoOne.className} text-gray-100 flex justify-center my-5 text-2xl `}
        >
          Disc Golf
        </h1>
      </div>
      <div className="flex flex-col justify-center items-center text-center">
        <p
          className={`${russoOne.className} text-gray-100 flex justify-center my-5 text-xl `}
        >
          Course Name
        </p>

        <input
          className="text-lg text-gray-100 p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
          type="text"
          placeholder="Course Name"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
        />
      </div>
      <div
        className={`${russoOne.className} text-gray-100 flex flex-col gap-2 items-center mt-10`}
      >
        <p> Number of Holes {numHoles}</p>
        <div className="flex gap-4">
          <button
            onClick={() => setNumHoles((prev) => Math.max(prev - 1, 1))}
            className="bg-blue-800  text-gray-100 px-3 py-1 rounded text-lg"
          >
            -
          </button>
          <button
            onClick={() => setNumHoles((prev) => Math.min(25, prev + 1))}
            className="bg-blue-800 text-gray-100 px-3 py-1 rounded text-lg"
          >
            +
          </button>
        </div>
      </div>
      <div className="mt-10 mb-5">
        <label
          className={`${russoOne.className} text-gray-100 flex flex-col gap-2 items-center`}
        >
          <input
            type="checkbox"
            checked={trackStats}
            onChange={(e) => setTrackStats(e.target.checked)}
            className="h-5 w-5 bg-gray-900"
          />
          Track Fairway Hits, C1 and C2 Putting
        </label>
      </div>
      <div className="flex flex-col justify-center items-center text-center">
        <p
          className={`${russoOne.className} text-gray-100 flex justify-center my-5 text-xl `}
        >
          Add Players
        </p>

        <input
          className="text-lg text-gray-100 p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  dark:text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
          type="text"
          placeholder={`Player ${players.length + 1}`}
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
        />
      </div>
      <button
        onClick={addPlayer}
        className={`${russoOne.className} flex items-center justify-center mx-auto  bg-blue-800 py-2 px-10 mt-10 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
      >
        <Plus />
      </button>
      <div className="flex flex-col justify-center items-center text-center mt-10">
        {players.length > 0 && (
          <p
            className={`${russoOne.className} text-gray-100 text-xl border-b mb-5`}
          >
            Players
          </p>
        )}
        {players.map((player, index) => (
          <div key={index}>
            <p className={`${russoOne.className} text-gray-100 text-xl mb-5`}>
              {player === userDisplayName ? `${player} (you)` : player}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={startGame}
        className={`${russoOne.className} flex items-center justify-center w-full mb-5  bg-blue-800 py-2 px-10 mt-10 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
      >
        Start
      </button>
      <DeleteSessionBtn onDelete={resetSessionState} />
    </div>
  );
}
