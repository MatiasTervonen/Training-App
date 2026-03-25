"use client";

import { useState } from "react";
import Image from "next/image";
import type { SessionImage } from "@/types/media";

type MediaImageProps = {
  image: SessionImage;
};

export default function MediaImage({ image }: MediaImageProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <button
        onClick={() => setFullscreen(true)}
        className="rounded-md overflow-hidden border-[1.5px] border-blue-500/60 bg-slate-950"
      >
        <Image
          src={image.uri}
          alt=""
          width={400}
          height={192}
          className="w-full h-48 object-cover"
          unoptimized
        />
      </button>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreen(false)}
        >
          <Image
            src={image.uri}
            alt=""
            width={1920}
            height={1080}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            unoptimized
          />
        </div>
      )}
    </>
  );
}
