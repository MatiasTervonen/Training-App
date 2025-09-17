"use client";

import SaveButton from "../../ui/save-button";
import { useState, useEffect } from "react";
import ModalPageWrapper from "../../components/modalPageWrapper";
import toast from "react-hot-toast";
import ExerciseTypeSelect from "../../training/components/ExerciseTypeSelect";
import TitleInput from "../../training/components/TitleInput";
import FullScreenLoader from "../../components/FullScreenLoader";
import { mutate } from "swr";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import ProfilePicture from "../components/profile-picture";

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

  const userNameZ = useUserStore((state) => state.preferences?.display_name);
  const weightUnitZ = useUserStore((state) => state.preferences?.weight_unit);
  const profilePicZ = useUserStore(
    (state) => state.preferences?.profile_picture
  );

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  useEffect(() => {
    setUserName(userNameZ || "");
    setWeightUnit(weightUnitZ || "kg");
    setProfilePicPreview(profilePicZ || null);
  }, [userNameZ, weightUnitZ, profilePicZ]);

  const saveProfilePicture = async () => {
    if (!selectedProfilePic) return profilePicZ || null;

    const fileSize = selectedProfilePic.size;

    if (fileSize > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return null;
    }

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

      mutate("/api/settings/get-settings");
      return `${data.publicUrl}?v=${Date.now()}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return profilePicZ || null;
    }
  };

  const updateSettings = async () => {
    setIsSaving(true);

    const profilePictureUrl = await saveProfilePicture();

    if (!profilePictureUrl) {
      setIsSaving(false);
      return;
    }

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

  return (
    <ModalPageWrapper>
      <div className="p-5 h-full relative">
        <div className="max-w-md mx-auto">
          <h1 className="text-gray-100 flex justify-center my-5 text-2xl">
            Profile Settings
          </h1>
          <div>
            <TitleInput
              label="User Name"
              placeholder="Enter your user name..."
              title={userName}
              setTitle={(value) =>
                setUserName(
                  value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                    .slice(0, 15)
                )
              }
            />
            <p className="text-sm text-gray-500 mt-2">
              Max 15 characters. Only lowercase letters, numbers, and
              &quot;_&quot; allowed.
            </p>
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
            <p className="text-sm text-gray-500 mt-2">Max size 5MB.</p>
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

      {isSaving && <FullScreenLoader message="Saving settings..." />}
    </ModalPageWrapper>
  );
}
