"use client";

import { BookOpen } from "lucide-react";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { FeedCardProps } from "@/types/session";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";

export default function TutorialCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");

  return (
    <BaseFeedCard
      item={{ ...item, title: t("feed.tutorial.title", { appName: APP_NAME }) }}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={<BookOpen size={20} className="text-slate-300" />}
      typeName={t("feed.card.types.tutorial")}
      statsContent={
        <div>
          <p className="text-slate-300 font-body">
            {t("feed.tutorial.subtitle", { appName: APP_NAME })}
          </p>
          <p className="text-sm mt-1 text-slate-400 font-body">
            {t("feed.tutorial.tap_to_read")}
          </p>
        </div>
      }
    />
  );
}
