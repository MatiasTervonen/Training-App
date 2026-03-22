"use client";

import Image from "next/image";
import { LinkPreview } from "@/types/chat";
import { X } from "lucide-react";

type LinkPreviewCardProps = {
  preview: LinkPreview;
  onDismiss?: () => void;
};

export default function LinkPreviewCard({ preview, onDismiss }: LinkPreviewCardProps) {
  return (
    <div className="relative border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-1 right-1 p-1 rounded-full bg-slate-700/80 hover:bg-slate-600 z-10"
        >
          <X size={12} />
        </button>
      )}
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 p-2"
      >
        {preview.image && (
          <div className="shrink-0 w-16 h-16 relative rounded overflow-hidden">
            <Image
              src={preview.image}
              alt={preview.title || ""}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {preview.title && (
            <p className="text-sm truncate">{preview.title}</p>
          )}
          {preview.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{preview.description}</p>
          )}
          {preview.site_name && (
            <p className="text-xs text-gray-500 mt-0.5">{preview.site_name}</p>
          )}
        </div>
      </a>
    </div>
  );
}
