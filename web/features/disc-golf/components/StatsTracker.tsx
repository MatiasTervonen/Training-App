"use client";

import { PlayerStats } from "@/features/disc-golf/types/disc-golf";

type Props = {
  playerName: string;
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
};

export default function StatsTracker({
  playerName,
  playerStats,
  setPlayerStats,
}: Props) {
  const player = playerStats[playerName];

  if (!player) return null;

  return (
    <div>
      <div className="flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 mt-5">
        <label>Fairway Hit</label>
        <input
          className="h-5 w-5"
          type="checkbox"
          checked={player.fairwayHit ?? false}
          onChange={(e) =>
            setPlayerStats((prev) => ({
              ...prev,
              [playerName]: {
                ...prev[playerName],
                fairwayHit: e.target.checked,
              },
            }))
          }
        />
      </div>
      <div className="flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10">
        <label>C1 Made</label>
        <input
          className="h-5 w-5"
          type="checkbox"
          checked={player.c1made ?? false}
          onChange={(e) =>
            setPlayerStats((prev) => ({
              ...prev,
              [playerName]: {
                ...prev[playerName],
                c1made: e.target.checked,
                c1attempted: e.target.checked
                  ? true
                  : prev[playerName]?.c1attempted,
              },
            }))
          }
        />
      </div>
      <div className="flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10">
        <label>C1 Attempted</label>
        <input
          className="h-5 w-5"
          type="checkbox"
          checked={player.c1attempted ?? false}
          onChange={(e) =>
            setPlayerStats((prev) => ({
              ...prev,
              [playerName]: {
                ...prev[playerName],
                c1attempted: e.target.checked,
                c1made: e.target.checked ? prev[playerName]?.c1made : false,
              },
            }))
          }
        />
      </div>
      <div className="flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10">
        <label> C2 Made</label>
        <input
          className="h-5 w-5"
          type="checkbox"
          checked={player.c2made ?? false}
          onChange={(e) =>
            setPlayerStats((prev) => ({
              ...prev,
              [playerName]: {
                ...prev[playerName],
                c2made: e.target.checked,
                c2attempted: e.target.checked
                  ? true
                  : prev[playerName]?.c2attempted,
              },
            }))
          }
        />
      </div>
      <div className="flex justify-between items-center gap-2 border-b border-gray-100 text-gray-100 mx-10 mb-5">
        <label> C2 Attempted</label>
        <input
          className="h-5 w-5"
          type="checkbox"
          checked={player.c2attempted ?? false}
          onChange={(e) =>
            setPlayerStats((prev) => ({
              ...prev,
              [playerName]: {
                ...prev[playerName],
                c2attempted: e.target.checked,
                c2made: e.target.checked ? prev[playerName]?.c2made : false,
              },
            }))
          }
        />
      </div>
    </div>
  );
}
