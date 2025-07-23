"use client";

import SaveButton from "../../ui/save-button";
import { useState, useEffect } from "react";
import ModalPageWrapper from "../../components/modalPageWrapper";
import toast from "react-hot-toast";
import ExerciseTypeSelect from "../../training/components/ExerciseTypeSelect";
import TitleInput from "../../training/components/TitleInput";
import FullScreenLoader from "../../components/FullScreenLoader";
import useSWR, { mutate } from "swr";
import Spinner from "../../components/spinner";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import ProfilePicture from "../components/profile-picture";
import { fetcher } from "../../lib/fetcher";
import { users } from "@/app/(app)/types/models";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [selectedProfilePic, setSelectedProfilePic] = useState<File | null>(
    null
  );
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null
  );

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  const {
    data: settings,
    error,
    isLoading,
  } = useSWR<users>("/api/settings/get-settings", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (settings && !error) {
      setUserName(settings.display_name || "");
      setWeightUnit(settings.weight_unit || "kg");
      setProfilePicPreview(settings.profile_picture || null);
    }
  }, [settings, error]);

  const saveProfilePicture = async () => {
    if (!selectedProfilePic) return settings?.profile_picture || null;

    const formData = new FormData();
    formData.append("file", selectedProfilePic);

    try {
      const res = await fetch("/api/settings/save-profilePic", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();

      toast.success("Profile picture updated successfully!");
      mutate("/api/settings/get-settings");
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return settings?.profile_picture || null;
    }
  };

  const updateSettings = async () => {
    setIsSaving(true);

    const profilePictureUrl = await saveProfilePicture();

    const payload = {
      display_name: userName,
      weight_unit: weightUnit,
      profile_picture: profilePictureUrl,
    };

    try {
      const res = await fetch("/api/settings/save-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update settings");
      }

      setPreferences(payload);
      toast.success("Settings updated successfully!");
      mutate("/api/settings/get-settings");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isUserNameTaken = async (name: string) => {
    try {
      const res = await fetch(
        "/api/settings/userName-available?name=" + encodeURIComponent(name),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        throw new Error("Failed to check username availability");
      }

      const data = await res.json();
      return data.isTaken;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  };

  useEffect(() => {
    console.log("selectedProfilePic changed:", selectedProfilePic);
  }, [selectedProfilePic]);

  return (
    <ModalPageWrapper noTopPadding>
      {isLoading || !settings ? (
        <div className="mt-50 flex flex-col items-center ">
          <p className="text-gray-400 text-lg mb-4">Loading settings...</p>
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center mt-50 px-5 w-full">
          <p className="text-lg text-red-500 mb-4 text-center">
            Error loading settings. Try again...
          </p>
        </div>
      ) : (
        <div className="p-5 min-h-[calc(100dvh-72px)] relative">
          <div className="max-w-md mx-auto">
            <h1 className="text-gray-100 flex justify-center my-5 text-2xl">
              Profile Settings
            </h1>
            <div className="w-fit">
              <TitleInput
                label="User Name"
                placeholder="Enter your user name..."
                title={userName}
                setTitle={(value) =>
                  setUserName(value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                }
              />
            </div>
            <div className="mt-5">
              <ProfilePicture
                data={
                  profilePicPreview
                    ? `${profilePicPreview}?t=${Date.now()}`
                    : "/default-avatar.png"
                }
                onFileSelected={(file, previewUrl) => {
                  setSelectedProfilePic(file);
                  setProfilePicPreview(previewUrl);
                }}
              />
            </div>
            <div className="mt-5 w-fit">
              <ExerciseTypeSelect
                onChange={(value) => setWeightUnit(value)}
                value={weightUnit}
                label="Weight Unit"
                options={[
                  { value: "kg", label: "kg" },
                  { value: "lbs", label: "lbs" },
                ]}
              />
            </div>
            <div className="mt-10">
              <SaveButton
                isSaving={isSaving}
                onClick={async () => {
                  if (!userName.trim()) {
                    toast.error("User name cannot be empty.");
                    return;
                  }
                  const isTaken = await isUserNameTaken(userName);
                  if (isTaken) {
                    toast.error(
                      "User name is already taken. Please choose another."
                    );
                    return;
                  }
                  updateSettings();
                }}
                label="Save Changes"
              />
            </div>
          </div>
        </div>
      )}

      {isSaving && <FullScreenLoader message="Saving settings..." />}
    </ModalPageWrapper>
  );
}
