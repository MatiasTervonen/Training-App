"use client";

import { Dumbbell, Timer, ImageIcon, Mic, Video } from "lucide-react";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type gymPayload = {
  duration: number;
  exercises_count: number;
  sets_count: number;
  "image-count"?: number;
  "video-count"?: number;
  "voice-count"?: number;
};

export default function GymCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as gymPayload;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const voiceCount = payload["voice-count"] ?? 0;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Dumbbell size={20} className="text-slate-300" />}
      typeName={t("feed.card.types.gym")}
      showUpdatedAt={true}
      statsContent={
        <div>
          {(voiceCount > 0 || imageCount > 0 || videoCount > 0) && (
            <div className="flex items-center gap-3 mb-1">
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
          <div className="flex gap-6 items-center">
            {payload.exercises_count > 0 && payload.sets_count > 0 && (
              <div className="flex gap-4 items-center">
                <span className="text-slate-300">
                  {t("feed.card.exercises")}: {payload.exercises_count}
                </span>
                <span className="text-slate-300">
                  {t("feed.card.sets")}: {payload.sets_count}
                </span>
              </div>
            )}
            {payload.duration > 0 && (
              <div className="flex items-center gap-2">
                <Timer size={20} className="text-slate-300" />
                <span className="text-slate-300">
                  {Math.floor(payload.duration / 60)} {t("feed.card.min")}
                </span>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
