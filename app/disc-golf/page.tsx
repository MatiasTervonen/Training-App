"use client";

import { russoOne } from "../ui/fonts";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import { createClient } from "@/utils/supabase/client";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { clearLocalStorage } from "./components/ClearLocalStorage";
import TitleInput from "../training/components/TitleInput";

export default function DiscGolf() {
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState<string>("");
  const [courseName, setCourseName] = useState("");
  const [trackStats, setTrackStats] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [numHoles, setNumHoles] = useState<number>(18); // Default to 18
  const router = useRouter();

  useEffect(() => {
    const activeSession = localStorage.getItem("activeSession");
    if (activeSession) {
      alert(
        "You already have an active session. Finish it before starting a new one."
      );
      router.back();
    }
  }, []);

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
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div
        className={` ${russoOne.className} bg-slate-800 p-5 h-full max-w-md mx-auto`}
      >
        <div className="flex flex-col h-full w-full justify-between">
          <div>
            <h1 className="text-gray-100 flex justify-center my-5 text-2xl ">
              Disc Golf
            </h1>
          </div>
          <TitleInput
            title={courseName}
            placeholder="Course Name"
            setTitle={setCourseName}
            label="Course Name"
          />

          <div className=" text-gray-100 flex flex-col gap-2 items-center mt-10">
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
            <label className=" text-gray-100 flex flex-col gap-2 items-center">
              <input
                type="checkbox"
                checked={trackStats}
                onChange={(e) => setTrackStats(e.target.checked)}
                className="h-5 w-5 bg-gray-900"
              />
              Track Fairway Hits, C1 and C2 Putting
            </label>
          </div>
          <TitleInput
            title={newPlayer}
            setTitle={setNewPlayer}
            label="Add Players"
            placeholder={`Player ${players.length + 1}`}
          />
          <button
            onClick={addPlayer}
            className=" flex items-center justify-center mx-auto  bg-blue-800 py-2 px-10 mt-10 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
          >
            <Plus />
          </button>
          <div className="flex flex-col justify-center items-center text-center mt-10 ">
            {players.length > 0 && (
              <p className="text-gray-100 text-xl border-b mb-5">Players</p>
            )}
            {players.map((player, index) => (
              <div key={index}>
                <p className="text-gray-100 text-xl mb-5">
                  {player === userDisplayName ? `${player} (you)` : player}
                </p>
              </div>
            ))}
          </div>
          <div className="pb-5">
            <button
              onClick={startGame}
              className=" flex items-center justify-center w-full mb-5  bg-blue-800 py-2 px-10 mt-10 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
            >
              Start
            </button>
            <DeleteSessionBtn onDelete={resetSessionState} />
          </div>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
