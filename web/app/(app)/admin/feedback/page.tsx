"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SquareArrowOutUpRight, MessageSquare, ImageIcon } from "lucide-react";
import useFeedbackFeed from "@/features/admin/hooks/useFeedbackFeed";
import { FeedbackItem } from "@/database/admin/get-feedback";
import { ensureHtml } from "@/features/notes/lib/ensureHtml";
import { formatDateShort, formatDateTime } from "@/lib/formatDate";
import { createClient } from "@/utils/supabase/client";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal";

const categoryColors: Record<string, string> = {
  bug: "bg-red-500/20 text-red-400",
  feature: "bg-blue-500/20 text-blue-400",
  general: "bg-gray-500/20 text-gray-400",
};

const cardGradients: Record<string, string> = {
  bug: "card-danger",
  feature: "card-notes",
  general: "card-default",
};

function stripForPreview(content: string): string {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function FeedbackImages({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState<string | null>(null);

  useEffect(() => {
    if (paths.length === 0) return;
    const supabase = createClient();

    Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from("feedback-images")
          .createSignedUrl(path, 3600);
        return data?.signedUrl ?? "";
      }),
    ).then((signed) => setUrls(signed.filter(Boolean)));
  }, [paths]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="grid gap-3 grid-cols-2 mt-3">
        {urls.map((url) => (
          <button
            key={url}
            onClick={() => setFullscreen(url)}
            className="rounded-md overflow-hidden border-[1.5px] border-blue-500/60 bg-slate-950"
          >
            <img src={url} alt="" className="w-full h-48 object-cover" />
          </button>
        ))}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreen(null)}
        >
          <img
            src={fullscreen}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </>
  );
}

function FeedbackFeedCard({
  item,
  onExpand,
}: {
  item: FeedbackItem;
  onExpand: () => void;
}) {
  const { t } = useTranslation("common");
  const imageCount = item.image_paths.length;

  return (
    <div className="shadow-sm shadow-black/50 rounded-md">
      <div className="border rounded-md flex flex-col justify-between transition-colors min-h-40 overflow-hidden card-default border-slate-700">
        {/* Header - title + category badge */}
        <div className="flex justify-between items-center px-4 pt-2 pb-1">
          <div className="flex-1 mr-4 text-lg line-clamp-1 text-gray-100">
            {item.title}
          </div>
          <span
            className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${categoryColors[item.category] ?? categoryColors.general}`}
          >
            {t(`admin.feedback.categories.${item.category}`)}
          </span>
        </div>

        {/* Preview content */}
        <div className="flex-1 flex items-center font-body px-4 pb-2">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              {item.display_name}
              {item.user_email && (
                <span className="text-slate-500"> · {item.user_email}</span>
              )}
            </p>
            {imageCount > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <ImageIcon size={12} className="text-slate-400" />
                <span className="text-xs text-slate-400">{imageCount}</span>
              </div>
            )}
            <p className="line-clamp-2 wrap-break-words text-slate-300">
              {stripForPreview(item.message)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-slate-900/40 px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-slate-300" />
            <span className="text-slate-400 text-sm">
              {t(`admin.feedback.categories.${item.category}`)}
            </span>
            <span className="text-slate-500 text-sm">·</span>
            <span className="text-slate-400 text-sm">
              {formatDateShort(item.created_at)}
            </span>
          </div>
          <button
            aria-label={t("admin.feedback.details")}
            onClick={onExpand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <SquareArrowOutUpRight size={18} className="text-slate-500" />
            <span className="text-slate-500 text-sm">
              {t("admin.feedback.details")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedbackExpanded({ item }: { item: FeedbackItem }) {
  const { t } = useTranslation("common");

  return (
    <div className="text-center max-w-3xl mx-auto page-padding">
      <div className="flex flex-col gap-2 text-sm text-gray-400 font-body">
        <span
          className={`self-center text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[item.category] ?? categoryColors.general}`}
        >
          {t(`admin.feedback.categories.${item.category}`)}
        </span>
        <p>{formatDateTime(item.created_at)}</p>
        <p className="text-slate-500">
          {item.display_name}
          {item.user_email && <span> · {item.user_email}</span>}
        </p>
      </div>

      <div className="relative bg-white/5 px-5 pt-5 pb-10 rounded-md shadow-md mt-5">
        <div className="text-xl text-center mb-10 border-b border-gray-700 pb-2 wrap-break-words">
          {item.title}
        </div>
        <div
          className="prose prose-invert max-w-none text-left font-body"
          dangerouslySetInnerHTML={{ __html: ensureHtml(item.message) }}
        />

        {item.image_paths.length > 0 && (
          <FeedbackImages paths={item.image_paths} />
        )}
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { t } = useTranslation("common");
  const {
    items,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFeedbackFeed();

  const [expandedItem, setExpandedItem] = useState<FeedbackItem | null>(null);

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Category filter
  const [filter, setFilter] = useState<string>("all");
  const filtered =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="max-w-2xl mx-auto page-padding">
      <h1 className="text-2xl mb-6 text-center">
        {t("admin.feedback.title")}
      </h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {["all", "bug", "feature", "general"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-sm font-body px-3 py-1.5 rounded-full transition-colors ${
              filter === cat
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {t(`admin.feedback.filters.${cat}`)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner size="w-8 h-8" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-gray-400 font-body py-10">
          {t("admin.feedback.empty")}
        </p>
      )}

      {/* Feed */}
      {filtered.map((item) => (
        <div className="mt-8" key={item.id}>
          <FeedbackFeedCard
            item={item}
            onExpand={() => setExpandedItem(item)}
          />
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner size="w-5 h-5" />
        </div>
      )}

      {/* Expanded modal */}
      <Modal isOpen={!!expandedItem} onClose={() => setExpandedItem(null)}>
        {expandedItem && <FeedbackExpanded item={expandedItem} />}
      </Modal>
    </div>
  );
}
