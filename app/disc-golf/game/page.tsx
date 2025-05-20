"use client";

import { russoOne } from "@/app/ui/fonts";
import Timer from "@/app/components/timer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteSessionBtn from "@/app/ui/deleteSessionBtn";
import { motion, AnimatePresence } from "framer-motion";
import { SquareArrowLeft } from "lucide-react";
import { SquareArrowRight } from "lucide-react";

type HoleData = {
  hole_number: number;
  length: number;
  par: number;
  scores: {
    c2attempted: boolean;
    c1attempted: boolean;
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

type PlayerStats = {
  [playerName: string]: {
    strokes?: number;
    fairwayHit: boolean;
    c1made: boolean;
    c1attempted: boolean;
    c2made: boolean;
    c2attempted: boolean;
  };
};

export default function DiscGolfGame() {
  const [hole, setHole] = useState(1);
  const [length, setLength] = useState(""); // input value
  const [par, setPar] = useState(3); // input value
  const [courseName, setCourseName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({});
  const [trackStats, setTrackStats] = useState(false);
  const router = useRouter();
  const [totalHoles, setTotalHoles] = useState<number>(18); // default fallback
  const [holeHistory, setHoleHistory] = useState<HoleData[]>([]);
  const [viewingHoleNumber, setViewingHoleNumber] = useState<number>(1);
  const [direction, setDirection] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const [previousHoleNumber, setPreviousHoleNumber] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (viewingHoleNumber) {
      localStorage.setItem("viewingHoleNumber", viewingHoleNumber.toString());
    }
  }, [viewingHoleNumber]);

  useEffect(() => {
    if (viewingHoleNumber < 1) {
      setViewingHoleNumber(1); // Prevent ever rendering hole 0
      return;
    }

    if (previousHoleNumber === null || !players.length) {
      setPreviousHoleNumber(viewingHoleNumber);
      return;
    }

    const updatedHole: HoleData = {
      hole_number: previousHoleNumber,
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
      (h) => h.hole_number === previousHoleNumber
    );

    if (existingIndex !== -1) {
      updatedHistory[existingIndex] = updatedHole;
    } else {
      updatedHistory.push(updatedHole);
    }

    setHoleHistory(updatedHistory);
    localStorage.setItem("holes", JSON.stringify(updatedHistory));

    setPreviousHoleNumber(viewingHoleNumber);
  }, [viewingHoleNumber]);

  useEffect(() => {
    const savedHoles = localStorage.getItem("holes");
    if (savedHoles) {
      setHoleHistory(JSON.parse(savedHoles));
    }
  }, []);

  useEffect(() => {
    const holeData = holeHistory.find(
      (h) => h.hole_number === viewingHoleNumber
    );
    if (!holeData) return;

    setPar(holeData.par);
    setLength(holeData.length?.toString() || "");

    const stats: typeof playerStats = {};
    holeData.scores.forEach((s) => {
      stats[s.playerName] = {
        strokes: s.strokes,
        fairwayHit: s.fairwayHit,
        c1made: s.c1made,
        c1attempted: s.c1made || false,
        c2made: s.c2made,
        c2attempted: s.c2made || false,
      };
    });

    setPlayerStats(stats);
  }, [viewingHoleNumber]);

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

  useEffect(() => {
    const setup = localStorage.getItem("setupData");
    const savedHoles = localStorage.getItem("holes");
    const currentHole = localStorage.getItem("currentHole");
    const savedViewingHole = localStorage.getItem("viewingHoleNumber");
    const trackStats = localStorage.getItem("trackStats");
    const numHoles = localStorage.getItem("numHoles");

    if (setup) {
      const { courseName, players } = JSON.parse(setup);
      setCourseName(courseName);
      setPlayers(players);
    }

    if (savedHoles) {
      const parsedHoles = JSON.parse(savedHoles);
      setHoleHistory(parsedHoles);
    }

    const holeToLoad = parseInt(currentHole || savedViewingHole || "1");

    setHole(holeToLoad);
    setViewingHoleNumber(holeToLoad);
    setPreviousHoleNumber(holeToLoad); // <--- ensure this is initialized here

    if (trackStats) {
      setTrackStats(JSON.parse(trackStats));
    }

    if (numHoles) {
      setTotalHoles(parseInt(numHoles));
    }
  }, []);

  useEffect(() => {
    const holeData = holeHistory.find(
      (h) => h.hole_number === viewingHoleNumber
    );
    if (!holeData) {
      // This is a new hole

      setPar(3);
      setLength("");

      setPlayerStats(
        players.reduce((acc, player) => {
          acc[player.name] = {
            strokes: 3, // Default to 3 strokes
            fairwayHit: false,
            c1made: false,
            c1attempted: false,
            c2made: false,
            c2attempted: false,
          };
          return acc;
        }, {} as PlayerStats)
      );
      return;
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

    setPlayerStats(stats);
  }, [holeHistory, viewingHoleNumber, players]);

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
      hole_number: viewingHoleNumber,
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

    const updatedHoles = [...existingHoles, holeData];

    localStorage.setItem("holes", JSON.stringify([...existingHoles, holeData]));

    localStorage.setItem("currentHole", JSON.stringify(nextHole));

    setHoleHistory(updatedHoles);
    setHole(nextHole);
    setViewingHoleNumber(nextHole);
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
          strokes: 3,
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
    <div className="bg-slate-800">
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
      <div className="fixed inset-0 z-0 h-screen flex justify-between bg-slate-600">
        {!isSwiping && (
          <>
            <div className="flex flex-col items-center pt-32 gap-2 mx-2">
              <div className="text-gray-400 text-center text-2xl font-bold ">
                <p>H</p>
                <p>O</p>
                <p>L</p>
                <p>E</p>
                <p> {viewingHoleNumber === 1 ? 2 : viewingHoleNumber - 1}</p>
              </div>

              <SquareArrowLeft size={35} className="text-gray-100/60" />
            </div>
            <div className="flex flex-col items-center gap-2 mx-2 pt-32">
              {viewingHoleNumber === totalHoles ? (
                <div className="text-gray-400 text-center text-2xl font-bold ">
                  <p>F</p>
                  <p>I</p>
                  <p>N</p>
                  <p>I</p>
                  <p>S</p>
                  <p>H</p>
                </div>
              ) : (
                <div className="text-gray-400 text-center text-2xl font-bold">
                  <p>H</p>
                  <p>O</p>
                  <p>L</p>
                  <p>E</p>
                  <p>{viewingHoleNumber + 1}</p>
                </div>
              )}

              <SquareArrowRight size={35} className="text-gray-100/60" />
            </div>
          </>
        )}
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={viewingHoleNumber}
          className="absolute top-29 inset-0 z-50 overflow-y-auto bg-slate-800 p-5"
          custom={direction}
          initial="enter"
          animate="center"
          exit="exit"
          onAnimationComplete={() => {
            setIsSwiping(false);
          }}
          variants={{
            enter: (direction: number) => ({
              x: direction > 0 ? 300 : -300,
              opacity: 0,
            }),
            center: {
              x: 0,
              opacity: 1,
            },
            exit: (direction: number) => ({
              x: direction > 0 ? -300 : 300,
              opacity: 0,
            }),
          }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            const swipeDistance = info.offset.x;
            const threshold = 150; // Minimum distance to trigger a swipe

            if (swipeDistance > threshold && viewingHoleNumber > 1) {
              setIsSwiping(true);
              setDirection(-1);
              setViewingHoleNumber((prev) => prev - 1);
            } else if (
              swipeDistance < -threshold &&
              viewingHoleNumber < totalHoles
            ) {
              setIsSwiping(true);
              setDirection(1);
              setViewingHoleNumber((prev) => prev + 1);
            } else if (
              swipeDistance < -threshold &&
              viewingHoleNumber === totalHoles
            ) {
              setIsSwiping(true);
              handleFinishGame();
            }
          }}
        >
          <h1
            className={`${russoOne.className} text-gray-100 flex justify-center my-2 text-2xl `}
          >
            Hole {viewingHoleNumber}
          </h1>
          <p
            className={`${russoOne.className} text-gray-100 flex justify-center my-2  `}
          >
            {courseName}
          </p>
          <div className="border-2 border-gray-100 p-5 rounded-xl mb-10 mx-10">
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

            <div
              className={`${russoOne.className} flex items-center justify-between gap-2 text-gray-100 `}
            >
              <p className="text-xl">Par</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPar((prev) => Math.max(3, prev - 1))}
                  className="bg-blue-800 text-gray-100 px-4 py-2 rounded"
                >
                  -
                </button>
                <span>{par}</span>
                <button
                  onClick={() => setPar((prev) => Math.min(5, prev + 1))}
                  className="bg-blue-800 text-gray-100 px-4 py-2 rounded"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {getSortedPlayersByScoreAndLastHole().map((player, index) => (
            <div key={index} className="flex flex-col gap-2 mt-5 mb-10">
              <div
                className={`${russoOne.className} flex items-center justify-between text-gray-100 text-lg border-b`}
              >
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
                    className="bg-blue-800 text-gray-100 px-4 py-2 rounded"
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
                  <span>{playerStats[player.name]?.strokes ?? 0}</span>
                  <button
                    className="bg-blue-800 text-gray-100 px-4 py-2 rounded"
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
                <div>
                  <div
                    className={`${russoOne.className} flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 mt-5`}
                  >
                    <label>Fairway Hit</label>
                    <input
                      className="h-5 w-5"
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
                  </div>
                  <div
                    className={`${russoOne.className} flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 `}
                  >
                    <label>C1 Made</label>
                    <input
                      className="h-5 w-5"
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
                  </div>
                  <div
                    className={`${russoOne.className} flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 `}
                  >
                    <label>C1 Attempted</label>
                    <input
                      className="h-5 w-5"
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
                  </div>
                  <div
                    className={`${russoOne.className} flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 `}
                  >
                    <label> C2 Made</label>
                    <input
                      className="h-5 w-5"
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
                  </div>
                  <div
                    className={`${russoOne.className} flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 mb-5`}
                  >
                    <label> C2 Attempted</label>
                    <input
                      className="h-5 w-5"
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
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="mb-10">
            {viewingHoleNumber < totalHoles && (
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
                "viewingHoleNumber",
              ]}
              onDelete={() => router.push("/disc-golf")}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
