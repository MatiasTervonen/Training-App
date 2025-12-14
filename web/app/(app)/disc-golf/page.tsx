"use client";

import { useState, useEffect } from "react";
import DeleteSessionBtn from "../components/buttons/deleteSessionBtn";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { clearLocalStorage } from "./components/ClearLocalStorage";
import CustomInput from "../ui/CustomInput";
import { useTimerStore } from "../lib/stores/timerStore";
import BaseButton from "../components/buttons/BaseButton";
import toast from "react-hot-toast";

export default function DiscGolf() {
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState<string>("");
  const [courseName, setCourseName] = useState("");
  const [trackStats, setTrackStats] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [numHoles, setNumHoles] = useState<number>(18); // Default to 18
  const router = useRouter();

  const { setActiveSession, startTimer } = useTimerStore();

  const activeSession = useTimerStore((state) => state.activeSession);

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
    if (activeSession) {
      toast.error(
        "You already have an active session. Finish it before starting a new one."
      );
      return;
    }

    clearLocalStorage();

    const randomizedPlayers = shuffleArray(players);

    const setupData = {
      courseName,
      sessionIsRunning: true,
      players: randomizedPlayers.map((p) => ({
        name: p,
        is_quest: p !== userDisplayName,
      })),
    };

    localStorage.setItem("setupData", JSON.stringify(setupData));

    localStorage.setItem("trackStats", JSON.stringify(trackStats));

    localStorage.setItem("numHoles", JSON.stringify(numHoles));

    startTimer(0);

    setActiveSession({
      type: "disc-golf",
      label: `Disc Golf - ${courseName}`,
      path: "/disc-golf/game",
    });

    router.push("/disc-golf/game");
  };

  const resetSessionState = () => {
    setPlayers([]);
    setNewPlayer("");
    setCourseName("");
    setTrackStats(false);
  };

  return (
    <div className="max-w-md mx-auto page-padding flex flex-col min-h-full justify-between">
      <div>
        <h1 className="flex justify-center text-2xl mb-10">Disc Golf</h1>
        <CustomInput
          value={courseName}
          placeholder="Course Name"
          setValue={setCourseName}
          label="Course Name"
        />
      </div>

      <div>
        <div className="flex flex-col gap-2 items-center mt-10">
          <p> Number of Holes {numHoles}</p>
          <div className="flex gap-4">
            <button
              onClick={() => setNumHoles((prev) => Math.max(prev - 1, 1))}
              className="bg-blue-800 px-3 py-1 rounded text-lg hover:bg-blue-600 hover:scale-105"
            >
              -
            </button>
            <button
              onClick={() => setNumHoles((prev) => Math.min(25, prev + 1))}
              className="bg-blue-800 px-3 py-1 rounded text-lg hover:bg-blue-600 hover:scale-105"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-10 mb-5">
          <label className="flex flex-col gap-2 items-center">
            <input
              type="checkbox"
              checked={trackStats}
              onChange={(e) => setTrackStats(e.target.checked)}
              className="h-5 w-5 bg-gray-900"
            />
            Track Fairway Hits, C1 and C2 Putting
          </label>
        </div>
      </div>
      <div>
        <CustomInput
          value={newPlayer}
          setValue={setNewPlayer}
          label="Add Players"
          placeholder={`Player ${players.length + 1}`}
        />
        <BaseButton onClick={addPlayer} label="Add" className="mt-10" />
      </div>
      <div className="flex flex-col justify-center items-center text-center mt-10">
        {players.length > 0 && <p className="text-xl border-b mb-5">Players</p>}
        {players.map((player, index) => (
          <div key={index}>
            <p className="text-xl mb-5">
              {player === userDisplayName ? `${player} (you)` : player}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5 mt-10">
        <BaseButton onClick={startGame} />
        <DeleteSessionBtn onDelete={resetSessionState} />
      </div>
    </div>
  );
}
