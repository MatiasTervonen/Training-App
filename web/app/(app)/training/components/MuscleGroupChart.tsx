import { useMemo } from "react";
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
import { Last30DaysAnalytics } from "../../types/session";

export default function MuscleGroupChart({
  data,
}: {
  data: Last30DaysAnalytics;
}) {
  const chartData = useMemo(() => {
    return data.analytics.muscle_groups
      .map((item) => ({
        name: item.group,
        exercises: item.count,
      }))
      .sort((a, b) => b.exercises - a.exercises);
  }, [data]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={600}>
        <BarChart
          data={chartData}
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
