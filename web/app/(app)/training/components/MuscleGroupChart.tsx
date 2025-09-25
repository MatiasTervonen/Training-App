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

export default function MuscleGroupChart({
  data,
}: {
  data: full_gym_session[];
}) {
  function muscle_groupData(data: full_gym_session[]) {
    const muscleGroupCount: { [key: string]: number } = {};
    data.forEach((session) => {
      session.gym_session_exercises.forEach((exercise) => {
        const group = exercise.gym_exercises;
        const name = group.muscle_group;
        if (muscleGroupCount[name]) {
          muscleGroupCount[name] += 1;
        } else {
          muscleGroupCount[name] = 1;
        }
      });
    });
    return muscleGroupCount;
  }

  const chartData = Object.entries(muscle_groupData(data)).map(
    ([name, value]) => ({ name, exercises: value })
  );

  const shortedData = chartData.sort((a, b) => b.exercises - a.exercises);

  return (
    <div>
      <ResponsiveContainer width="100%" height={600}>
        <BarChart
          data={shortedData}
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
          <Bar dataKey="exercises" fill="#8884d8">
            <LabelList dataKey="name" position="insideLeft" fill="#fff" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
