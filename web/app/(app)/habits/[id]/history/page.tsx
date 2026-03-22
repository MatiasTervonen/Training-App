"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import MonthGrid from "@/features/habits/components/MonthGrid";
import Spinner from "@/components/spinner";

export default function HabitHistoryPage() {
  const { t } = useTranslation("habits");
  const { id } = useParams<{ id: string }>();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { data: habits, isLoading: habitsLoading } = useHabits();
  const habit = habits?.find((h) => h.id === id);

  // Generate 3 months to display: previous, current, next
  const months = useMemo(() => {
    const result = [];
    for (let offset = -2; offset <= 0; offset++) {
      const d = new Date(viewYear, viewMonth + offset, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
  }, [viewYear, viewMonth]);

  // Fetch logs covering all 3 months
  const startDate = `${months[0].year}-${String(months[0].month + 1).padStart(2, "0")}-01`;
  const lastMonth = months[months.length - 1];
  const endDate = `${lastMonth.year}-${String(lastMonth.month + 1).padStart(2, "0")}-${new Date(lastMonth.year, lastMonth.month + 1, 0).getDate()}`;
  const { data: logs, isLoading: logsLoading } = useHabitLogs({
    startDate,
    endDate,
    habitId: id,
  });

  const goBack = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goForward = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  if (habitsLoading) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto flex justify-center pt-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-6 text-2xl">
        {habit?.name ?? t("habits.seeFullHistory")}
      </h1>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={goBack} className="p-2 cursor-pointer">
          <ChevronLeft size={24} className="text-slate-400" />
        </button>
        <button onClick={goForward} className="p-2 cursor-pointer">
          <ChevronRight size={24} className="text-slate-400" />
        </button>
      </div>

      {logsLoading ? (
        <div className="flex justify-center pt-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {months.map(({ year, month }) => (
            <div key={`${year}-${month}`} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <MonthGrid
                year={year}
                month={month}
                habits={habits ?? []}
                logs={logs ?? []}
                habitId={id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
