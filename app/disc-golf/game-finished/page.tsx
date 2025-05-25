"use client";

import { russoOne } from "@/app/ui/fonts";
import { useEffect, useState } from "react";
import Image from "next/image";
import { clearLocalStorage } from "../components/ClearLocalStorage";
import SaveButton from "@/app/ui/save-button";
import { useRouter } from "next/navigation";

export default function GameFinished() {
  const [holes, setHoles] = useState<
    {
      hole_number: number;
      par: number;
      scores: {
        playerName: string;
        strokes: number;
        fairwayHit: boolean;
        c1made: boolean;
        c1attempted: boolean;
        c2made: boolean;
        c2attempted: boolean;
      }[];
    }[]
  >([]);
  const [time, setTime] = useState("N/A");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dataJSON = localStorage.getItem("holes");
    if (dataJSON) {
      setHoles(JSON.parse(dataJSON));
    }

    const endTime = localStorage.getItem("finalTime");

    if (endTime) {
      const totalSeconds = parseInt(endTime, 10);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setTime(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    }
  }, []);

  const finishGame = async () => {
    setIsSaving(true);
    clearLocalStorage();
    router.push("/");
  };

  return (
    <div className="bg-slate-800 p-5 min-h-[100dvh] relative">
      <h1 className={`${russoOne.className} text-gray-100 text-center text-xl`}>
        Final Scores
      </h1>
      {holes.length > 0 &&
        (() => {
          const playerData: {
            [playerName: string]: {
              hole: number;
              strokes: number;
              fairwayHit: boolean;
              c1made: boolean;
              c1attempted: boolean;
              c2made: boolean;
              c2attempted: boolean;
            }[];
          } = {};

          holes.forEach((hole) => {
            hole.scores.forEach((score) => {
              if (!playerData[score.playerName]) {
                playerData[score.playerName] = [];
              }
              playerData[score.playerName].push({
                hole: hole.hole_number,
                strokes: score.strokes,
                fairwayHit: score.fairwayHit,
                c1made: score.c1made,
                c1attempted: score.c1attempted,
                c2made: score.c2made,
                c2attempted: score.c2attempted,
              });
            });
          });

          const sortedPlayers = Object.entries(playerData)
            .map(([playerName, scores]) => {
              const total = scores.reduce((acc, s) => acc + s.strokes, 0);
              const totalPar = scores.reduce((sum, s) => {
                const hole = holes.find((h) => h.hole_number === s.hole);
                return sum + (hole?.par ?? 0);
              }, 0);
              const scoreAgainstPar = total - totalPar;

              return { playerName, total, scores, scoreAgainstPar };
            })
            .sort((a, b) => a.scoreAgainstPar - b.scoreAgainstPar);

          return (
            <div className="flex flex-col mt-4">
              {sortedPlayers.map(
                ({ playerName, scores, total, scoreAgainstPar }, index) => {
                  const formattedScore =
                    scoreAgainstPar === 0
                      ? "E"
                      : scoreAgainstPar > 0
                      ? `+${scoreAgainstPar}`
                      : `${scoreAgainstPar}`;

                  const birdies = scores.filter((s) => {
                    const hole = holes.find((h) => h.hole_number === s.hole);
                    return hole && s.strokes === hole.par - 1;
                  }).length;

                  const fairwayHits = scores.filter((s) => s.fairwayHit).length;
                  const fairwayTotal = scores.length;

                  const c1made = scores.filter((s) => s.c1made).length;
                  const c1attempted = scores.filter(
                    (s) => s.c1attempted
                  ).length;

                  const c2made = scores.filter((s) => s.c2made).length;
                  const c2attempted = scores.filter(
                    (s) => s.c2attempted
                  ).length;

                  const pct = (made: number, attempted: number) => {
                    if (attempted === 0) return 0;
                    return Math.round((made / attempted) * 100);
                  };
                  const medals = [
                    "/GoldMedal.png",
                    "/SilverMedal.png",
                    "/BronzeMedal.png",
                  ];

                  return (
                    <div
                      key={playerName}
                      className="mb-4 rounded-md p-2 bg-slate-900"
                    >
                      <div className="flex gap-2 items-center mb-2 border-b border-gray-100">
                        {medals[index] && (
                          <Image
                            src={medals[index]}
                            alt="medal"
                            width={30}
                            height={30}
                            className="pb-1"
                          />
                        )}
                        <h2
                          className={`${russoOne.className} text-gray-100 text-xl `}
                        >
                          {playerName}
                        </h2>
                      </div>
                      <table
                        className={`${russoOne.className} w-full text-left text-gray-100 `}
                      >
                        <tbody>
                          <tr className="border-b border-slate-500">
                            <th className="py-2 pr-4">Total Strokes</th>
                            <td>
                              {total} ({formattedScore})
                            </td>
                          </tr>
                          <tr className="border-b border-slate-500">
                            <th className="py-2 pr-4">Birdies</th>
                            <td>{birdies}</td>
                          </tr>
                          <tr className="border-b border-slate-500">
                            <th className="py-2 pr-4">Fairway hits</th>
                            <td>
                              {fairwayHits} / {fairwayTotal} (
                              {pct(fairwayHits, fairwayTotal)}%)
                            </td>
                          </tr>
                          <tr className="border-b border-slate-500">
                            <th className="py-2 pr-4">C1 putting</th>
                            <td>
                              {c1made} / {c1attempted} (
                              {pct(c1made, c1attempted)}
                              %)
                            </td>
                          </tr>
                          <tr className="border-b border-slate-500">
                            <th className="py-2 pr-4">C2 putting</th>
                            <td>
                              {c2made} / {c2attempted} (
                              {pct(c2made, c2attempted)}
                              %)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                }
              )}
              <div></div>
            </div>
          );
        })()}
      <div className="flex gap-4">
        <h2 className={`${russoOne.className} text-gray-100 text-lg mb-2`}>
          Round Time
        </h2>
        <p className={`${russoOne.className} text-gray-100 text-xl mb-5`}>
          {time}
        </p>
      </div>
      <SaveButton isSaving={isSaving} onClick={finishGame} />
    </div>
  );
}
