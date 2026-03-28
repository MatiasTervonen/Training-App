"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

type Props = {
  data: string | null;
  onFileSelected?: (file: File | null, previewUrl: string | null) => void;
  size?: number;
};

export default function ProfilePicture({
  data,
  onFileSelected,
  size = 100,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imgSrc = previewUrl || data || "/default-avatar.png";

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative group cursor-pointer"
        style={{ width: size, height: size }}
      >
        <Image
          src={imgSrc}
          alt="Profile Picture"
          width={size}
          height={size}
          className="object-cover w-full h-full rounded-full border-2 border-slate-700"
        />
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          const preview = file ? URL.createObjectURL(file) : null;
          setPreviewUrl(preview);
          if (onFileSelected) {
            onFileSelected(file, preview);
          }
        }}
      />
    </div>
  );
}
