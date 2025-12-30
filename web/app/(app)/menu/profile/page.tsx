"use client";

import SaveButton from "@/app/(app)/components/buttons/save-button";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ExerciseTypeSelect from "@/app/(app)/gym/components/ExerciseTypeSelect";
import CustomInput from "@/app/(app)/ui/CustomInput";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import ProfilePicture from "@/app/(app)/menu/components/profile-picture";
import { fileTypeFromBlob } from "file-type";
import { saveUserProfile } from "@/app/(app)/database/settings/save-user-profile";
import { validateUserName } from "@/app/(app)/database/settings/validateUserName";

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
    if (!selectedProfilePic) return null;

    const fileSize = selectedProfilePic.size;

    const fileType = await fileTypeFromBlob(selectedProfilePic);
    if (
      !fileType ||
      !["image/jpeg", "image/png", "image/webp"].includes(fileType.mime)
    ) {
      toast.error(
        "Invalid file type. Please upload a JPEG, PNG, or WEBP image."
      );
      return null;
    }

    if (fileSize > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return null;
    }

    const formData = new FormData();
    formData.append("file", selectedProfilePic);

    try {
      const res = await fetch("/api/settings/save-profilePic-web", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();

      return `${data.publicUrl}?v=${Date.now()}`;
    } catch (error) {
      console.log("error uploading image", error);
      toast.error("Failed to upload image");
      return profilePicZ || null;
    }
  };

  const updateSettings = async () => {
    setIsSaving(true);
    try {
      const uploadedProfilePic = await saveProfilePicture();

      if (selectedProfilePic && !uploadedProfilePic) {
        setIsSaving(false);
        return;
      }

      const profilePictureUrl = uploadedProfilePic ?? profilePicZ ?? null;

      const isTaken = await validateUserName(userName);

      if (isTaken) {
        return toast.error(
          "User name is already taken. Please choose another."
        );
      }

      const payload = {
        display_name: userName,
        weight_unit: weightUnit,
        profile_picture: profilePictureUrl,
      };

      await saveUserProfile(payload);

      setPreferences(payload);
      toast.success("Settings updated successfully!");
    } catch {
      toast.error("Error updating settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="flex justify-center my-5 text-2xl">Profile Settings</h1>
      <div>
        <CustomInput
          label="User Name"
          placeholder="Enter your user name..."
          spellCheck={false}
          value={userName}
          setValue={(value) =>
            setUserName(value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15))
          }
        />
        <p className="text-sm text-gray-500 mt-2">
          Max 15 characters. Only letters numbers, and &quot;_&quot; allowed.
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
        <p className="text-sm text-gray-500 mt-2">
          Max size 5MB. JPEG, PNG, and WEBP formats allowed.
        </p>
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
          onClick={async () => updateSettings()}
          label="Save Changes"
        />
      </div>
      {isSaving && <FullScreenLoader message="Saving settings..." />}
    </div>
  );
}
