"use client";

import { useEffect, useState } from "react";

export default function DiscGolfScores() {
  const [holes, setHoles] = useState<
    {
      hole_number: number;
      par: number;
      scores: { playerName: string; strokes: number }[];
    }[]
  >([]);

  useEffect(() => {
    const dataJSON = localStorage.getItem("holes");
    if (dataJSON) {
      setHoles(JSON.parse(dataJSON));
    }
  }, []);

  return (
      <div className="bg-slate-800 p-5 h-full relative">
        <div className="flex items-center justify-between mb-8 mx-2">
          <h1 className="text-gray-100 text-center text-xl">
            Live Scorecard
          </h1>
        </div>

        {holes.length > 0 &&
          (() => {
            const playerData: {
              [playerName: string]: { hole: number; strokes: number }[];
            } = {};

            holes.forEach((hole) => {
              hole.scores.forEach((score) => {
                if (!playerData[score.playerName]) {
                  playerData[score.playerName] = [];
                }
                playerData[score.playerName].push({
                  hole: hole.hole_number,
                  strokes: score.strokes,
                });
              });
            });

            return Object.entries(playerData).map(([playerName, scores]) => {
              const totalStrokes = scores.reduce(
                (sum, s) => sum + s.strokes,
                0
              );
              const totalPar = scores.reduce((sum, s) => {
                const hole = holes.find((h) => h.hole_number === s.hole);
                return sum + (hole?.par ?? 0);
              }, 0);
              const scoreAgainstPar = totalStrokes - totalPar;
              const formattedScore =
                scoreAgainstPar === 0
                  ? "E"
                  : scoreAgainstPar > 0
                  ? `+${scoreAgainstPar}`
                  : `${scoreAgainstPar}`;

              return (
                <div key={playerName} className="mb-10">
                  <h2
                    className="text-gray-100 text-lg mb-2"
                  >
                    {playerName}
                  </h2>
                  <table className="text-gray-100 border border-gray-600 w-full text-left bg-slate-900 ">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="p-2">Hole</th>
                        <th className="p-2">Strokes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((score) => {
                        const holePar = holes.find(
                          (h) => h.hole_number === score.hole
                        )?.par;
                        return (
                          <tr
                            key={score.hole}
                            className="border-b border-gray-600"
                          >
                            <td className="p-2">
                              {score.hole}
                              {holePar != null && ` (Par ${holePar})`}
                            </td>
                            <td className="p-2">
                              {(() => {
                                const hole = holes.find(
                                  (h) => h.hole_number === score.hole
                                );
                                const par = hole?.par;
                                const diff =
                                  par != null ? score.strokes - par : null;

                                const isHoleInOne = score.strokes === 1;

                                let circleClass = "";

                                if (isHoleInOne)
                                  circleClass = "bg-yellow-500 text-gray-100";
                                else if (diff === -1)
                                  circleClass = "bg-blue-500 text-gray-100";
                                else if (diff! <= -2)
                                  circleClass = "bg-green-500 text-gray-100";
                                else if (diff === 0)
                                  circleClass = "bg-gray-500 text-gray-100";
                                else if (diff === 1)
                                  circleClass = "bg-red-500 text-gray-100";
                                else if (diff === 2)
                                  circleClass = "bg-purple-600 text-gray-100";
                                else if (diff! >= 3)
                                  circleClass = "bg-black text-gray-100";

                                let formattedDiff = "";
                                if (diff != null) {
                                  if (diff === 0) formattedDiff = "E";
                                  else if (diff > 0) formattedDiff = `+${diff}`;
                                  else formattedDiff = `${diff}`;
                                }

                                return (
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`inline-block w-8 h-8 leading-8 rounded-full text-center ${
                                        circleClass || ""
                                      }`}
                                    >
                                      {score.strokes}
                                    </span>
                                    <span>{formattedDiff}</span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <p className="text-gray-200 mt-2">
                    Total: {totalStrokes} ({formattedScore})
                  </p>
                </div>
              );
            });
          })()}
      </div>
  );
}
