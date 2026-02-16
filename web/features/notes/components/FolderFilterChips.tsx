"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

const TAB_WIDTH = 100;
const GAP = 8;
const CONTAINER_PADDING = 4;

function useDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
    },
    [ref],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const el = ref.current;
      if (!el) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft.current - (x - startX.current);
    },
    [ref],
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return { onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp };
}

type FolderFilterChipsProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelectAll: () => void;
  onSelectFolder: (folderId: string) => void;
};

export default function FolderFilterChips({
  folders,
  selectedFolderId,
  onSelectAll,
  onSelectFolder,
}: FolderFilterChipsProps) {
  const { t } = useTranslation("notes");
  const isAllSelected = !selectedFolderId;
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragHandlers = useDragScroll(scrollRef);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, folders]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeIndex = selectedFolderId
      ? folders.findIndex((f) => f.id === selectedFolderId) + 1
      : 0;

    const tabCenter =
      CONTAINER_PADDING + activeIndex * (TAB_WIDTH + GAP) + TAB_WIDTH / 2;

    const scrollX = Math.max(0, tabCenter - container.clientWidth / 2);
    container.scrollTo({ left: scrollX, behavior: "smooth" });
  }, [selectedFolderId, folders]);

  return (
    <div className="py-3">
      <div
        ref={scrollRef}
        {...dragHandlers}
        className="flex items-center bg-slate-800 rounded-lg p-1 min-w-0 gap-1 overflow-x-auto select-none"
      >
        {canScrollLeft && (
          <ChevronLeft size={16} className="shrink-0 text-gray-400 sticky left-0 z-10" />
        )}

        <button
          onClick={onSelectAll}
          className={`py-2 px-3 rounded-md text-center font-medium text-sm transition-colors w-[100px] truncate shrink-0 ${
            isAllSelected ? "bg-slate-700 text-cyan-400" : "text-gray-200"
          }`}
        >
          {t("notes.folders.all")}
        </button>

        {folders.map((folder) => {
          const isActive = selectedFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`py-2 px-3 rounded-md text-center font-medium text-sm transition-colors w-[100px] truncate shrink-0 ${
                isActive ? "bg-slate-700 text-cyan-400" : "text-gray-200"
              }`}
            >
              {folder.name}
            </button>
          );
        })}

        {canScrollRight && (
          <ChevronRight size={16} className="shrink-0 text-gray-400 sticky right-0 z-10" />
        )}
      </div>
    </div>
  );
}
