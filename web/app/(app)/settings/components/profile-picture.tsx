import { useState, useRef } from "react";
import Image from "next/image";

type props = {
  data: string | null;
  onFileSelected?: (file: File | null, previewUrl: string | null) => void;
};

export default function ProfilePicture({ data, onFileSelected }: props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="text-gray-100">
      <label>Profile Picture</label>
      <div className="border rounded-full w-20 h-20 mt-2 mb-4">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Profile Preview"
            width={80}
            height={80}
            className="object-cover w-full h-full rounded-full"
          />
        ) : data ? (
          <Image
            src={data}
            alt="Profile Picture"
            width={80}
            height={80}
            className="object-cover w-full h-full rounded-full"
          />
        ) : (
          <Image
            src={"/default-avatar.png"}
            alt="Profile Picture"
            width={80}
            height={80}
            className="object-cover w-full h-full rounded-full"
          />
        )}
      </div>
      <div className="flex flex-col cursor-pointer">
        <div className="flex items-center gap-2 border-2 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] rounded-md p-2 w-fit hover:border-blue-500 focus:outline-none focus:border-green-300">
          <button
            className="cursor-pointer"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Change profile picture
          </button>
          <span>{fileName}</span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            const preview = file ? URL.createObjectURL(file) : null;
            setPreviewUrl(preview);
            setFileName(file ? file.name : "");
            if (onFileSelected) {
              onFileSelected(file, preview);
            }
          }}
        />
      </div>
    </div>
  );
}
