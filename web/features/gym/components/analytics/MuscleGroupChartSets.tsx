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
import { Last30DaysAnalytics } from "@/types/session";
import { useTranslation } from "react-i18next";

export default function MuscleGroupChart({
  data,
}: {
  data: Last30DaysAnalytics;
}) {
  const { t } = useTranslation("gym");

  const chartDataSets = useMemo(() => {
    return data.analytics.sets_per_muscle_group
      .map((item) => ({
        name: t(`gym.muscleGroups.${item.group}`),
        sets: item.count,
      }))
      .sort((a, b) => b.sets - a.sets);
  }, [data, t]);

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
          <Bar
            dataKey="sets"
            fill="#8884d8"
            name={t("gym.analytics.tabs.sets")}
          >
            <LabelList dataKey="name" position="insideLeft" fill="#fff" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
