"use client";

import MuscleGroupChart from "./MuscleGroupChart";
import MuscleGroupChartSets from "./MuscleGroupChartSets";
import { full_gym_session } from "../../types/models";
import { useState } from "react";

export default function ChartTabSwitcher({
  data,
}: {
  data: full_gym_session[];
}) {
  const [activeTab, setActiveTab] = useState<
    "muscleGroups" | "muscleGroupSets"
  >("muscleGroups");

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab("muscleGroups")}
          className={`px-4 py-2 w-[150px] ${
            activeTab === "muscleGroups"
              ? "text-blue-500 bg-gray-800 rounded-2xl"
              : ""
          } cursor-pointer`}
        >
          exercises
        </button>
        <button
          onClick={() => setActiveTab("muscleGroupSets")}
          className={`px-4 py-2 w-[150px] ${
            activeTab === "muscleGroupSets"
              ? "text-blue-500 bg-gray-800 rounded-2xl"
              : ""
          } cursor-pointer`}
        >
          Sets
        </button>
      </div>
      {activeTab === "muscleGroups" && <MuscleGroupChart data={data} />}
      {activeTab === "muscleGroupSets" && <MuscleGroupChartSets data={data} />}
    </div>
  );
}
