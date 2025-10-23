import { full_gym_session } from "../../types/models";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useMemo } from "react";

export default function MuscleGroupChart({
  data,
}: {
  data: full_gym_session[];
}) {
  function muscle_groupDataSets(data: full_gym_session[]) {
    const muscleGroupSetCount: { [key: string]: number } = {};
    data.forEach((session) => {
      session.gym_session_exercises.forEach((exercise) => {
        const name = exercise.gym_exercises.muscle_group;

        exercise.gym_sets.forEach(() => {
          muscleGroupSetCount[name] = (muscleGroupSetCount[name] || 0) + 1;
        });
      });
    });
    return muscleGroupSetCount;
  }

  const chartDataSets = useMemo(() => {
    const entries = Object.entries(muscle_groupDataSets(data)).map(
      ([name, value]) => ({
        name,
        sets: value,
      })
    );
    return entries.sort((a, b) => b.sets - a.sets);
  }, [data]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={600}>
        <BarChart
          data={chartDataSets}
          layout="vertical"
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            tick={false}
            axisLine={false}
            width={0}
          />
          <Legend />
          <Bar dataKey="sets" fill="#8884d8" name="Sets">
            <LabelList dataKey="name" position="insideLeft" fill="#fff" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
