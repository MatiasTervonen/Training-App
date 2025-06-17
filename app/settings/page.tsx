"use client";

import { russoOne } from "../ui/fonts";
import SaveButton from "../ui/save-button";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ModalPageWrapper from "../components/modalPageWrapper";
import toast from "react-hot-toast";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const supabase = createClient();

  const saveSettings = async () => {
    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { display_name: userName },
    });

    if (error) {
      console.error("Failed to update userName:", error.message);
      toast.error("Failed to update user name. Please try again.");
    } else {
      toast.success("User name updated successfully!");
    }

    setIsSaving(false);
  };

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div className="p-5 min-h-[calc(100dvh-72px)] relative">
        <div className="max-w-md mx-auto">
          <h1
            className={`${russoOne.className} text-gray-100 flex justify-center my-5 text-2xl `}
          >
            Settings
          </h1>
          <div>
            <h2 className={`${russoOne.className} text-gray-100 flex mb-2`}>
              User Name
            </h2>
            <input
              className=" text-gray-100 p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              placeholder="User Name.."
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="mt-10">
            <SaveButton isSaving={isSaving} onClick={saveSettings} />
          </div>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
