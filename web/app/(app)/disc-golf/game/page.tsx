"use client";

import Timer from "@/components/timer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import { HoleData, Player, PlayerStats } from "@/features/disc-golf/types/disc-golf";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import { clearLocalStorage } from "@/features/disc-golf/components/ClearLocalStorage";
import { useTimerStore } from "@/lib/stores/timerStore";
import SwipeWrapper from "@/features/disc-golf/components/SwipeWrapper";
import StatsTracker from "@/features/disc-golf/components/StatsTracker";
import BaseButton from "@/components/buttons/BaseButton";

function readDiscGolfState() {
  if (typeof window === "undefined") return null;
  try {
    const setup = localStorage.getItem("setupData");
    const savedHoles = localStorage.getItem("holes");
    const currentHole = localStorage.getItem("currentHole");
    const savedViewingHole = localStorage.getItem("viewingHoleNumber");
    const trackStatsStr = localStorage.getItem("trackStats");
    const numHoles = localStorage.getItem("numHoles");

    const parsedSetup = setup ? JSON.parse(setup) : null;
    const parsedHoles: HoleData[] = savedHoles ? JSON.parse(savedHoles) : [];
    const parsedTrackStats = trackStatsStr ? JSON.parse(trackStatsStr) : false;
    const holeToLoad = parseInt(currentHole || savedViewingHole || "1");
    const parsedNumHoles = numHoles ? parseInt(numHoles) : 18;

    return {
      courseName: (parsedSetup?.courseName ?? "") as string,
      players: (parsedSetup?.players ?? []) as Player[],
      holeHistory: parsedHoles,
      trackStats: parsedTrackStats as boolean,
      viewingHoleNumber: holeToLoad,
      totalHoles: parsedNumHoles,
    };
  } catch {
    clearLocalStorage();
    return null;
  }
}

function computeHoleFormState(
  holeHistory: HoleData[],
  viewingHoleNumber: number,
  players: Player[]
): { par: number; length: string; playerStats: PlayerStats } {
  const holeData = holeHistory.find((h) => h.hole_number === viewingHoleNumber);
  if (!holeData) {
    return {
      par: 3,
      length: "",
      playerStats: players.reduce((acc, player) => {
        acc[player.name] = {
          strokes: 3,
          fairwayHit: false,
          c1made: false,
          c1attempted: false,
          c2made: false,
          c2attempted: false,
        };
        return acc;
      }, {} as PlayerStats),
    };
  }
  const stats: PlayerStats = {};
  holeData.scores.forEach((s) => {
    stats[s.playerName] = {
      strokes: s.strokes,
      fairwayHit: s.fairwayHit,
      c1made: s.c1made,
      c1attempted: s.c1attempted,
      c2made: s.c2made,
      c2attempted: s.c2attempted,
    };
  });
  return {
    par: holeData.par,
    length: holeData.length?.toString() || "",
    playerStats: stats,
  };
}

export default function DiscGolfGame() {
  const initialData = readDiscGolfState();
  const initialHole = computeHoleFormState(
    initialData?.holeHistory ?? [],
    initialData?.viewingHoleNumber ?? 1,
    initialData?.players ?? [],
  );

  const [length, setLength] = useState(initialHole.length);
  const [par, setPar] = useState(initialHole.par);
  const [courseName] = useState(initialData?.courseName ?? "");
  const [players] = useState<Player[]>(initialData?.players ?? []);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(initialHole.playerStats);
  const [trackStats] = useState(initialData?.trackStats ?? false);
  const router = useRouter();
  const [totalHoles] = useState<number>(initialData?.totalHoles ?? 18);
  const [holeHistory, setHoleHistory] = useState<HoleData[]>(initialData?.holeHistory ?? []);
  const [viewingHoleNumber, setViewingHoleNumber] = useState<number>(initialData?.viewingHoleNumber ?? 1);
  const [isSaving, setIsSaving] = useState(false);

  const { stopTimer, elapsedTime, activeSession } = useTimerStore();

  useEffect(() => {
    if (!activeSession) {
      router.push("/");
    }
  }, [activeSession, router]);

  const getPlayerTotals = (playerName: string) => {
    const playerHoles = holeHistory.flatMap((hole) =>
      hole.scores.filter((s) => s.playerName === playerName)
    );

    const totalStrokes = playerHoles.reduce((sum, s) => sum + s.strokes, 0);
    const totalPar = holeHistory.reduce((sum, hole) => sum + hole.par, 0);
    const diff = totalStrokes - totalPar;

    return {
      totalStrokes,
      formattedDiff: diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`,
    };
  };

  const getSortedPlayersByScoreAndLastHole = () => {
    const strokesMap: { [name: string]: number } = {};
    const lastHole = holeHistory[holeHistory.length - 1];

    // Total strokes up to current hole (excluding current one)
    players.forEach((player) => {
      const playerScores = holeHistory.flatMap((hole) =>
        hole.scores.filter((s) => s.playerName === player.name)
      );
      strokesMap[player.name] = playerScores.reduce(
        (sum, s) => sum + s.strokes,
        0
      );
    });

    return [...players].sort((a, b) => {
      const aTotal = strokesMap[a.name] ?? 0;
      const bTotal = strokesMap[b.name] ?? 0;

      if (aTotal !== bTotal) {
        return aTotal - bTotal; // lower total goes first
      }

      // If tied, compare last hole
      if (lastHole) {
        const aLast =
          lastHole.scores.find((s) => s.playerName === a.name)?.strokes ??
          Infinity;
        const bLast =
          lastHole.scores.find((s) => s.playerName === b.name)?.strokes ??
          Infinity;
        return aLast - bLast; // better last hole breaks tie
      }

      return 0;
    });
  };

  /** Save current hole data and return the updated history */
  const saveCurrentHole = (): HoleData[] => {
    if (!players.length) return holeHistory;

    const updatedHole: HoleData = {
      hole_number: viewingHoleNumber,
      length: parseInt(length),
      par,
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

    const updatedHistory = [...holeHistory];
    const existingIndex = updatedHistory.findIndex(
      (h) => h.hole_number === viewingHoleNumber
    );

    if (existingIndex !== -1) {
      updatedHistory[existingIndex] = updatedHole;
    } else {
      updatedHistory.push(updatedHole);
    }

    setHoleHistory(updatedHistory);
    localStorage.setItem("holes", JSON.stringify(updatedHistory));
    return updatedHistory;
  };

  /** Save current hole, navigate to a new hole, and load its form state */
  const navigateToHole = (newHoleNumber: number) => {
    if (newHoleNumber < 1) return;
    window.scrollTo(0, 0);

    const updatedHistory = saveCurrentHole();
    const holeState = computeHoleFormState(updatedHistory, newHoleNumber, players);

    setPar(holeState.par);
    setLength(holeState.length);
    setPlayerStats(holeState.playerStats);
    setViewingHoleNumber(newHoleNumber);

    localStorage.setItem("currentHole", JSON.stringify(newHoleNumber));
    localStorage.setItem("viewingHoleNumber", newHoleNumber.toString());
  };

  const handleNextHole = () => navigateToHole(viewingHoleNumber + 1);

  const handlePerviousHole = () => navigateToHole(viewingHoleNumber - 1);

  const handleFinishGame = async () => {
    const updatedHoles = saveCurrentHole();

    const duration = elapsedTime;
    setIsSaving(true);

    try {
      const response = await fetch("/api/disc-golf/save-golf-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseName,
          holes: updatedHoles,
          isPublic: false,
          type: "disc-golf",
          duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData.error);
        router.push("/dashboard");
      }

      await router.push("/disc-golf/game-finished");
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session. Please try again.");
    }
  };

  const deleteSession = () => {
    clearLocalStorage();
    stopTimer();
    router.push("/disc-golf");
  };

  return (
    <>
      <nav className="flex items-center justify-between bg-gray-700 p-2 px-4 w-full z-40 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2">
          <Timer />
        </div>
        <Link href="/disc-golf/score-summary" className="text-gray-100">
          Live Scorecard
        </Link>
      </nav>
      <div className="relative h-[calc(100dvh-112px)] max-w-3xl mx-auto overflow-hidden">
        <SwipeWrapper
          viewingHoleNumber={viewingHoleNumber}
          totalHoles={totalHoles}
          onNextHole={handleNextHole}
          onPreviousHole={handlePerviousHole}
          onFinishGame={handleFinishGame}
        >
          <div className="max-w-md mx-auto flex flex-col justify-between w-full min-h-full page-padding">
            <div>
              <h1 className="flex justify-center text-2xl mb-5">
                Hole {viewingHoleNumber}
              </h1>
              <p className="flex justify-center my-2">{courseName}</p>
              <div className="border-[1.5px] border-gray-100 p-5 rounded-xl mb-10 mx-10">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xl">Par</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setPar((prev) => Math.max(3, prev - 1))}
                      className="bg-blue-800 px-4 py-2 rounded"
                    >
                      -
                    </button>
                    <span className="w-5 text-center">{par}</span>
                    <button
                      onClick={() => setPar((prev) => Math.min(5, prev + 1))}
                      className="bg-blue-800 px-4 py-2 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {getSortedPlayersByScoreAndLastHole().map((player, index) => (
              <div key={index} className="flex flex-col gap-2 mt-5 mb-10">
                <div className="flex items-center justify-between text-lg border-b">
                  {(() => {
                    const { totalStrokes, formattedDiff } = getPlayerTotals(
                      player.name
                    );
                    return (
                      <p className="flex items-center gap-2">
                        {index === 0 && <span>🥏</span>}
                        {player.name} - {totalStrokes} ({formattedDiff})
                      </p>
                    );
                  })()}

                  <div className="flex items-center gap-6">
                    <button
                      className="bg-blue-800 px-4 py-2 rounded"
                      onClick={() =>
                        setPlayerStats((prev) => ({
                          ...prev,
                          [player.name]: {
                            ...prev[player.name],
                            strokes: Math.max(
                              (prev[player.name]?.strokes || 0) - 1,
                              0
                            ),
                          },
                        }))
                      }
                    >
                      -
                    </button>
                    <span className="w-5 text-center">
                      {playerStats[player.name]?.strokes ?? 0}
                    </span>
                    <button
                      className="bg-blue-800 px-4 py-2 rounded"
                      onClick={() =>
                        setPlayerStats((prev) => ({
                          ...prev,
                          [player.name]: {
                            ...prev[player.name],
                            strokes: Math.min(
                              (prev[player.name]?.strokes || 0) + 1,
                              12
                            ),
                          },
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                {trackStats && (
                  <StatsTracker
                    playerName={player.name}
                    playerStats={playerStats}
                    setPlayerStats={setPlayerStats}
                  />
                )}
              </div>
            ))}

            <div>
              <div className="flex gap-4 items-center mb-5">
                {viewingHoleNumber > 1 && (
                  <BaseButton onClick={handlePerviousHole} label="Prev Hole" />
                )}
                {viewingHoleNumber < totalHoles && (
                  <BaseButton onClick={handleNextHole} label="Next Hole" />
                )}
              </div>
              <div className="flex flex-row gap-5">
                <DeleteSessionBtn onDelete={deleteSession} />
                <SaveButton onClick={handleFinishGame} />
              </div>
            </div>
          </div>
        </SwipeWrapper>
        {isSaving && <FullScreenLoader message="Saving your game..." />}
      </div>
    </>
  );
}
