"use client";

import SocialFeedCardHeader from "@/features/social-feed/components/SocialFeedCardHeader";
import SocialFeedCardFooter from "@/features/social-feed/components/SocialFeedCardFooter";
import { SocialFeedItem } from "@/types/social-feed";
import { Dumbbell, Activity, Mic, ImageIcon, Video } from "lucide-react";
import { formatMeters, formatDuration } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";

type Props = {
  item: SocialFeedItem;
  onToggleLike: () => void;
  onExpand: () => void;
  onOpenComments: () => void;
  commentsOpen?: boolean;
};

function GymStats({ item }: { item: SocialFeedItem }) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as {
    duration: number;
    exercises_count: number;
    sets_count: number;
    "image-count"?: number;
    "video-count"?: number;
    "voice-count"?: number;
  };
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const voiceCount = payload["voice-count"] ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-5">
        {payload.exercises_count > 0 && (
          <div className="text-center">
            <p className="text-lg text-gray-100 font-body">{payload.exercises_count}</p>
            <p className="text-xs text-slate-400 font-body">{t("feed.card.exercises")}</p>
          </div>
        )}
        {payload.sets_count > 0 && (
          <div className="text-center">
            <p className="text-lg text-gray-100 font-body">{payload.sets_count}</p>
            <p className="text-xs text-slate-400 font-body">{t("feed.card.sets")}</p>
          </div>
        )}
        {payload.duration > 0 && (
          <div className="text-center">
            <p className="text-lg text-gray-200 font-body">
              {Math.floor(payload.duration / 60)}
            </p>
            <p className="text-xs text-slate-400 font-body">{t("feed.card.min")}</p>
          </div>
        )}
      </div>
      {(voiceCount > 0 || imageCount > 0 || videoCount > 0) && (
        <div className="flex items-center gap-3">
          {voiceCount > 0 && (
            <div className="flex items-center gap-1">
              <Mic size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400">{voiceCount}</span>
            </div>
          )}
          {imageCount > 0 && (
            <div className="flex items-center gap-1">
              <ImageIcon size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400">{imageCount}</span>
            </div>
          )}
          {videoCount > 0 && (
            <div className="flex items-center gap-1">
              <Video size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400">{videoCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityStats({ item }: { item: SocialFeedItem }) {
  const { t } = useTranslation("activities");
  const payload = item.extra_fields as {
    duration: number;
    distance: number;
  };

  return (
    <div className="flex items-center gap-5">
      {payload.distance > 0 && (
        <div className="text-center">
          <p className="text-lg text-gray-100 font-body">{formatMeters(payload.distance)}</p>
          <p className="text-xs text-slate-400 font-body">{t("activities.sessionStats.distance")}</p>
        </div>
      )}
      <div className="text-center">
        <p className="text-lg text-gray-100 font-body">{formatDuration(payload.duration)}</p>
        <p className="text-xs text-slate-400 font-body">{t("activities.sessionStats.duration")}</p>
      </div>
    </div>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case "gym_sessions":
      return <Dumbbell size={14} className="text-slate-400" />;
    case "activity_sessions":
      return <Activity size={14} className="text-slate-400" />;
    default:
      return null;
  }
}

function getTypeName(type: string, t: (key: string) => string) {
  switch (type) {
    case "gym_sessions":
      return t("feed.card.types.gym");
    case "activity_sessions":
      return t("feed.card.types.activity");
    default:
      return "";
  }
}

function getActivityTypeName(item: SocialFeedItem, t: (key: string, options?: Record<string, string>) => string) {
  const payload = item.extra_fields as { activity_name: string; activity_slug?: string };
  if (payload.activity_slug) {
    const translated = t(`activities.activityNames.${payload.activity_slug}`, { defaultValue: "" });
    if (translated && translated !== `activities.activityNames.${payload.activity_slug}`) {
      return translated;
    }
  }
  return payload.activity_name;
}

export default function SocialFeedCard({ item, onToggleLike, onExpand, onOpenComments, commentsOpen }: Props) {
  const { t } = useTranslation("feed");
  const { t: tActivities } = useTranslation("activities");

  const typeName = item.type === "activity_sessions"
    ? getActivityTypeName(item, tActivities)
    : getTypeName(item.type, t);

  const typeIcon = (
    <div className="flex items-center gap-1.5">
      {getTypeIcon(item.type)}
      <span className="text-slate-400 text-xs">{typeName}</span>
    </div>
  );

  const gradientClass = item.type === "gym_sessions" ? "card-gym" : "card-activity";

  return (
    <div className={`shadow-sm shadow-black/50 ${commentsOpen ? "rounded-t-md" : "rounded-md"}`}>
      <div className={`border border-slate-700 overflow-hidden ${gradientClass} ${commentsOpen ? "rounded-t-md border-b-0" : "rounded-md"}`}>
        {/* Author header with type badge */}
        <SocialFeedCardHeader item={item} typeIcon={typeIcon} />

        {/* Title */}
        <div className="px-4 pb-2">
          <p className="text-lg text-gray-100 truncate">{item.title}</p>
        </div>

        {/* Stats content */}
        <div className="px-4 pb-3">
          {item.type === "gym_sessions" && <GymStats item={item} />}
          {item.type === "activity_sessions" && <ActivityStats item={item} />}
        </div>

        {/* Footer with like, comment & details */}
        <SocialFeedCardFooter item={item} onToggleLike={onToggleLike} onExpand={onExpand} onOpenComments={onOpenComments} />
      </div>
    </div>
  );
}
