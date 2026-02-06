"use client";

import { FullActivitySession } from "@/app/(app)/types/models";
import {
  formatDate,
  formatTime,
  formatDuration,
} from "@/app/(app)/lib/formatDate";
import RouteMap from "./components/Map";
import SessionStats from "./components/SessionStats";
import { useTranslation } from "react-i18next";

type ActivitySessionProps = FullActivitySession & {
  feed_context: "pinned" | "feed";
};

export default function ActivitySession(
  activity_session: ActivitySessionProps,
) {
  const { t } = useTranslation("activities");

  const hasRoute = activity_session.route !== null;

  return (
    <div className="max-w-lg mx-auto page-padding">
      <p className="text-gray-300 text-center text-sm">
        {formatDate(activity_session.session.created_at!)}
      </p>

      <div className="bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-lg overflow-hidden shadow-md mt-5">
        <div className="p-5">
          <h2 className="text-xl text-center mb-5 border-b border-gray-700 pb-2 text-gray-100">
            {activity_session.session.title}
          </h2>

          <p className="text-lg text-center text-gray-100">
            {formatTime(activity_session.session.start_time!)} -{" "}
            {formatTime(activity_session.session.end_time!)}
          </p>

          {activity_session.session.notes && (
            <p className="text-lg text-left mt-5 text-gray-300 whitespace-pre-wrap">
              {activity_session.session.notes}
            </p>
          )}

          {!hasRoute && (
            <p className="text-lg text-center mt-5 text-gray-100">
              {t("activities.sessionDetails.duration")}:{" "}
              {formatDuration(activity_session.session.duration ?? 0)}
            </p>
          )}

          {!hasRoute && !!activity_session.stats?.steps && (
            <p className="text-lg text-center mt-5 text-gray-100">
              {t("activities.sessionDetails.steps")}:{" "}
              {activity_session.stats?.steps}
            </p>
          )}
        </div>
      </div>

      {hasRoute && (
        <div className="mt-10">
          <RouteMap activity_session={activity_session} />
          <SessionStats activity_session={activity_session} />
        </div>
      )}
    </div>
  );
}
