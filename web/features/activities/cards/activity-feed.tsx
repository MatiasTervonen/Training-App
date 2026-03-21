"use client";

import { Activity, Route, Timer } from "lucide-react";
import { formatMeters, formatDuration } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type activityPayload = {
  duration: number;
  distance: number;
  activity_name: string;
  activity_slug?: string;
};

export default function ActivityCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("activities");
  const payload = item.extra_fields as activityPayload;

  const getActivityTypeName = () => {
    if (payload.activity_slug) {
      const translated = t(
        `activities.activityNames.${payload.activity_slug}`,
        { defaultValue: "" },
      );
      if (
        translated &&
        translated !== `activities.activityNames.${payload.activity_slug}`
      ) {
        return translated;
      }
    }
    return payload.activity_name;
  };

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Activity size={20} className="text-slate-300" />}
      typeName={getActivityTypeName()}
      statsContent={
        <div className="flex items-center gap-5">
          {payload.distance > 0 && (
            <div className="flex items-center gap-2">
              <Route size={20} className="text-slate-300" />
              <span className="text-slate-300">
                {formatMeters(payload.distance)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Timer size={20} className="text-slate-300" />
            <span className="text-slate-300">
              {formatDuration(payload.duration)}
            </span>
          </div>
        </div>
      }
    />
  );
}
