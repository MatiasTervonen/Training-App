"use client";

import { FullActivitySession } from "@/types/models";
import { formatDateShort, formatTime, formatDurationLong } from "@/lib/formatDate";
import RouteMap from "@/features/activities/cards/activity-feed-expanded/components/Map";
import SessionStats from "@/features/activities/cards/activity-feed-expanded/components/SessionStats";
import { useTranslation } from "react-i18next";
import { ModalSwipeBlocker } from "@/components/modal";
import { useQuery } from "@tanstack/react-query";
import { getSessionMedia } from "@/database/media/get-session-media";
import SessionMediaGallery from "@/components/media/SessionMediaGallery";

type ActivitySessionProps = FullActivitySession & {
  feed_context: "pinned" | "feed";
};

export default function ActivitySession(
  activity_session: ActivitySessionProps,
) {
  const { t } = useTranslation("activities");

  const { data: media } = useQuery({
    queryKey: ["session-media", activity_session.session.id],
    queryFn: () => getSessionMedia(activity_session.session.id),
  });

  const hasRoute = activity_session.route !== null;

  return (
    <div className="max-w-lg mx-auto page-padding">
      <div className="bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-lg overflow-hidden shadow-md mt-5">
        <div className="p-5">
          <h2 className="text-xl text-center mb-4 text-gray-100">
            {activity_session.session.title}
          </h2>

          <p className="text-sm text-center text-gray-400">
            {formatDateShort(activity_session.session.start_time)} ·{" "}
            {formatTime(activity_session.session.start_time)} –{" "}
            {formatTime(activity_session.session.end_time)}
          </p>

          {activity_session.session.notes && (
            <p className="text-center mt-5 text-gray-300 whitespace-pre-wrap">
              {activity_session.session.notes}
            </p>
          )}

          {!hasRoute && (
            <p className="text-lg text-center mt-5 text-gray-100">
              {t("activities.sessionDetails.duration")}:{" "}
              {formatDurationLong(activity_session.session.duration)}
            </p>
          )}

          {!hasRoute && !!activity_session.stats?.steps && (
            <p className="text-lg text-center mt-5 text-gray-100">
              {t("activities.sessionDetails.steps")}:{" "}
              {activity_session.stats.steps}
            </p>
          )}

          {media && (
            <SessionMediaGallery
              images={media.images}
              videos={media.videos}
              voiceRecordings={media.voiceRecordings}
            />
          )}
        </div>
      </div>

      {hasRoute && (
        <div className="mt-10">
          <ModalSwipeBlocker>
            <RouteMap activity_session={activity_session} />
          </ModalSwipeBlocker>
          <SessionStats activity_session={activity_session} />
        </div>
      )}
    </div>
  );
}
