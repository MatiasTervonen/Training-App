"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/modal";
import Spinner from "@/components/spinner";
import { StatCard } from "@/components/StatCard";
import {
  TemplateHistorySession,
  TemplateHistoryMetric,
} from "@/types/models";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
  formatSpeed,
  getDistanceUnitLabels,
} from "@/lib/formatDate";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: TemplateHistorySession[];
  templateName: string;
  error?: string | null;
};

type RangeType = "1m" | "3m" | "6m" | "1y";

function getRangeStartDate(end: Date, range: RangeType): Date {
  const start = new Date(end);
  switch (range) {
    case "1m":
      start.setMonth(start.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  return start;
}

function getRangeDurationMs(range: RangeType): number {
  switch (range) {
    case "1m":
      return 30 * 24 * 60 * 60 * 1000;
    case "3m":
      return 90 * 24 * 60 * 60 * 1000;
    case "6m":
      return 180 * 24 * 60 * 60 * 1000;
    case "1y":
      return 365 * 24 * 60 * 60 * 1000;
  }
}

function formatChartValue(
  value: number,
  metric: TemplateHistoryMetric
): string {
  switch (metric) {
    case "avg_pace":
      return formatAveragePace(value);
    case "duration":
      return formatDurationLong(Math.round(value));
    case "avg_speed":
      return formatSpeed(value);
    default:
      return String(Math.round(value));
  }
}

export default function TemplateHistoryModal({
  isOpen,
  onClose,
  isLoading,
  history,
  templateName,
  error,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <TemplateHistoryContent
        isLoading={isLoading}
        history={history}
        templateName={templateName}
        error={error}
      />
    </Modal>
  );
}

function TemplateHistoryContent({
  isLoading,
  history,
  templateName,
  error,
}: Omit<Props, "isOpen" | "onClose">) {
  const { t, i18n } = useTranslation("activities");
  const locale = i18n.language;
  const labels = getDistanceUnitLabels();

  const [metric, setMetric] = useState<TemplateHistoryMetric>("avg_pace");
  const [range, setRange] = useState<RangeType>("3m");
  const [offset, setOffset] = useState(0);
  const [prevRange, setPrevRange] = useState(range);
  const [prevMetric, setPrevMetric] = useState(metric);

  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  if (metric !== prevMetric) {
    setPrevMetric(metric);
    setOffset(0);
  }

  const personalBests = useMemo(() => {
    if (!history || history.length === 0) return null;

    let fastestPace: {
      value: number;
      date: string;
      sessionId: string;
    } | null = null;
    let shortestDuration: {
      value: number;
      date: string;
      sessionId: string;
    } | null = null;

    for (const session of history) {
      if (
        session.avg_pace !== null &&
        session.avg_pace > 0 &&
        (!fastestPace || session.avg_pace < fastestPace.value)
      ) {
        fastestPace = {
          value: session.avg_pace,
          date: session.start_time,
          sessionId: session.session_id,
        };
      }

      if (
        session.duration > 0 &&
        (!shortestDuration || session.duration < shortestDuration.value)
      ) {
        shortestDuration = {
          value: session.duration,
          date: session.start_time,
          sessionId: session.session_id,
        };
      }
    }

    if (!fastestPace && !shortestDuration) return null;
    return { fastestPace, shortestDuration };
  }, [history]);

  const bestSessionIds = useMemo(() => {
    const ids = new Set<string>();
    if (personalBests?.fastestPace)
      ids.add(personalBests.fastestPace.sessionId);
    if (personalBests?.shortestDuration)
      ids.add(personalBests.shortestDuration.sessionId);
    return ids;
  }, [personalBests]);

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Chart data
  const allChartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const sorted = [...history].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    return sorted
      .map((session) => {
        const value =
          metric === "duration" ? session.duration : session[metric];
        if (value === null || value === undefined) return null;
        return { date: session.start_time, value };
      })
      .filter(Boolean) as { date: string; value: number }[];
  }, [history, metric]);

  const latestDate = useMemo(() => {
    if (allChartData.length === 0) return new Date();
    return new Date(
      Math.max(...allChartData.map((d) => new Date(d.date).getTime()))
    );
  }, [allChartData]);

  const oldestDate = useMemo(() => {
    if (allChartData.length === 0) return new Date();
    return new Date(
      Math.min(...allChartData.map((d) => new Date(d.date).getTime()))
    );
  }, [allChartData]);

  const { filteredChartData, rangeStart, rangeEnd, canGoBack } =
    useMemo(() => {
      const durationMs = getRangeDurationMs(range);
      const end = new Date(latestDate.getTime() - durationMs * offset);
      const startFromRange = getRangeStartDate(end, range);

      const filtered = allChartData.filter((d) => {
        const date = new Date(d.date);
        return date >= startFromRange && date <= end;
      });

      const nextEnd = new Date(
        latestDate.getTime() - durationMs * (offset + 1)
      );
      const nextStart = getRangeStartDate(nextEnd, range);

      return {
        filteredChartData: filtered,
        rangeStart: startFromRange,
        rangeEnd: end,
        canGoBack: nextStart >= oldestDate,
      };
    }, [allChartData, range, offset, latestDate, oldestDate]);

  const xTickFormatter = (dateStr: string) => {
    const date = new Date(dateStr);
    if (range === "1m" || range === "3m" || range === "6m") {
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
      }).format(date);
    }
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  };

  function formatDateRange(start: Date, end: Date) {
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    return `${fmt(start)} – ${fmt(end)}`;
  }

  const metrics: { key: TemplateHistoryMetric; label: string }[] = [
    { key: "avg_pace", label: t("activities.templateHistory.metricPace") },
    {
      key: "duration",
      label: t("activities.templateHistory.metricDuration"),
    },
    { key: "avg_speed", label: t("activities.templateHistory.metricSpeed") },
    {
      key: "calories",
      label: t("activities.templateHistory.metricCalories"),
    },
    { key: "steps", label: t("activities.templateHistory.metricSteps") },
  ];

  const ranges: { key: RangeType; label: string }[] = [
    { key: "1m", label: t("activities.templateHistory.range1m") },
    { key: "3m", label: t("activities.templateHistory.range3m") },
    { key: "6m", label: t("activities.templateHistory.range6m") },
    { key: "1y", label: t("activities.templateHistory.range1y") },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-20 p-5">
        <p className="text-lg font-body">
          {t("activities.templateHistory.loading")}
        </p>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 mt-20 text-center">
        <p className="text-red-500 text-lg">
          {t("activities.templateHistory.loadError")}
        </p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-5 mt-20 text-center">
        <p className="text-gray-400 text-lg font-body">
          {t("activities.templateHistory.noHistory")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      {/* Header */}
      <h2 className="text-center text-xl mb-6">{templateName}</h2>

      {/* Personal Bests */}
      {personalBests && (
        <div className="bg-linear-to-br from-amber-900/60 via-indigo-950 to-slate-900 rounded-lg px-4 py-4 border border-amber-500/60 mb-6">
          <p className="text-center text-amber-400 text-sm mb-3 font-body">
            {t("activities.templateHistory.personalBests")}
          </p>
          <div className="flex gap-4">
            {personalBests.fastestPace && (
              <div className="flex-1 text-center">
                <p className="text-xl text-cyan-400">
                  {formatAveragePace(personalBests.fastestPace.value)}
                </p>
                <p className="text-gray-400 text-xs mt-1 font-body">
                  {labels.pace}
                </p>
                <p className="text-gray-500 text-xs mt-1 font-body">
                  {formatDateWithYear(personalBests.fastestPace.date)}
                </p>
              </div>
            )}
            {personalBests.shortestDuration && (
              <div className="flex-1 text-center">
                <p className="text-xl text-cyan-400">
                  {formatDurationLong(
                    Math.round(personalBests.shortestDuration.value)
                  )}
                </p>
                <p className="text-gray-400 text-xs mt-1 font-body">
                  {t("activities.templateHistory.shortestDuration")}
                </p>
                <p className="text-gray-500 text-xs mt-1 font-body">
                  {formatDateWithYear(personalBests.shortestDuration.date)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Section */}
      {history.length >= 2 && (
        <div className="mb-6">
          {/* Metric Selector */}
          <div className="flex bg-slate-800 rounded-lg p-1 mb-4 overflow-x-auto">
            {metrics.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMetric(opt.key)}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap cursor-pointer ${
                  metric === opt.key
                    ? "bg-slate-700 text-cyan-400"
                    : "text-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Range Selector */}
          <div className="flex bg-slate-800 rounded-lg p-1 mb-4">
            {ranges.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer ${
                  range === opt.key
                    ? "bg-slate-700 text-cyan-400"
                    : "text-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date Range Navigation */}
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex justify-center items-center mb-4">
              <button
                onClick={() => setOffset((prev) => prev + 1)}
                disabled={!canGoBack}
                className={`mr-3 bg-slate-800 p-1 rounded cursor-pointer ${
                  !canGoBack ? "opacity-50" : ""
                }`}
              >
                <ChevronLeft
                  size={20}
                  className={canGoBack ? "text-cyan-400" : "text-gray-100"}
                />
              </button>
              <span className="text-center text-sm font-body min-w-[200px]">
                {formatDateRange(rangeStart, rangeEnd)}
              </span>
              <button
                onClick={() =>
                  setOffset((prev) => Math.max(0, prev - 1))
                }
                disabled={offset === 0}
                className={`ml-3 bg-slate-800 p-1 rounded cursor-pointer ${
                  offset === 0 ? "opacity-50" : ""
                }`}
              >
                <ChevronRight
                  size={20}
                  className={offset === 0 ? "text-gray-100" : "text-cyan-400"}
                />
              </button>
            </div>

            {/* Chart */}
            {filteredChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={filteredChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#9ca3af"
                    strokeOpacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={xTickFormatter}
                    tick={{ fill: "#f3f4f6", fontSize: 12 }}
                    axisLine={{ stroke: "#9ca3af" }}
                    tickLine={{ stroke: "#9ca3af" }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatChartValue(v, metric)}
                    tick={{ fill: "#f3f4f6", fontSize: 12 }}
                    axisLine={{ stroke: "#9ca3af" }}
                    tickLine={{ stroke: "#9ca3af" }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelFormatter={xTickFormatter}
                    formatter={(value: number) => [
                      formatChartValue(value, metric),
                      "",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#93c5fd"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ fill: "#3b82f6", stroke: "#60a5fa", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-gray-400 text-sm font-body">
                  {t("activities.templateHistory.noChartData")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-6">
        {history.map((session) => {
          const isBest = bestSessionIds.has(session.session_id);
          return (
            <div key={session.session_id}>
              <p className="text-lg mb-3 text-center font-body">
                {formatSessionDate(session.start_time)}
              </p>
              <div
                className={`p-4 rounded-lg border ${
                  isBest
                    ? "bg-linear-to-br from-amber-900/60 via-indigo-950 to-slate-900 border-amber-500/60 pt-2"
                    : "bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 border-gray-600"
                }`}
              >
                {isBest && (
                  <p className="text-amber-400 text-xs text-center mt-1 mb-3 font-body">
                    {t("activities.templateHistory.personalBest")}
                  </p>
                )}
                <div className="space-y-2">
                  {/* Row 1: Duration, Moving Time, Distance */}
                  <div className="flex gap-2">
                    <StatCard
                      label={t("activities.sessionStats.duration")}
                      value={formatDurationLong(Math.round(session.duration))}
                    />
                    {session.moving_time_seconds !== null && (
                      <StatCard
                        label={t("activities.sessionStats.movingTime")}
                        value={formatDurationLong(
                          Math.round(session.moving_time_seconds)
                        )}
                      />
                    )}
                    {session.distance_meters !== null && (
                      <StatCard
                        label={t("activities.sessionStats.distance")}
                        value={formatMeters(session.distance_meters)}
                      />
                    )}
                  </div>
                  {/* Row 2: Avg Pace, Avg Speed */}
                  {(session.avg_pace !== null ||
                    session.avg_speed !== null) && (
                    <div className="flex gap-2">
                      {session.avg_pace !== null && (
                        <StatCard
                          label={t("activities.sessionStats.avgPace")}
                          value={`${formatAveragePace(session.avg_pace)} ${labels.pace}`}
                        />
                      )}
                      {session.avg_speed !== null && (
                        <StatCard
                          label={t("activities.sessionStats.avgSpeed")}
                          value={formatSpeed(session.avg_speed)}
                        />
                      )}
                    </div>
                  )}
                  {/* Row 3: Calories, Steps */}
                  {(session.calories !== null ||
                    session.steps !== null) && (
                    <div className="flex gap-2">
                      {session.calories !== null && (
                        <StatCard
                          label={t("activities.sessionStats.calories")}
                          value={String(Math.round(session.calories))}
                        />
                      )}
                      {session.steps !== null && (
                        <StatCard
                          label={t("activities.sessionStats.steps")}
                          value={String(session.steps)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
