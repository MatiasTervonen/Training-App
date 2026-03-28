"use client";

import SaveButton from "@/components/buttons/save-button";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useUserStore } from "@/lib/stores/useUserStore";
import ProfilePicture from "@/features/menu/components/profile-picture";
import { fileTypeFromBlob } from "file-type";
import { saveUserProfile } from "@/database/settings/save-user-profile";
import { validateUserName } from "@/database/settings/validateUserName";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/ui/datepicker-custom.css";
import { fi } from "date-fns/locale/fi";
import { enUS } from "date-fns/locale/en-US";

const dateLocales = { en: enUS, fi: fi };
const dateFormats = { en: "MMMM d, yyyy", fi: "d. MMMM yyyy" };

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1 font-body">
        {title}
      </p>
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        !isLast ? "border-b border-slate-700/50" : ""
      }`}
    >
      <span className="text-sm font-body text-gray-200">{label}</span>
      {children}
    </div>
  );
}

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-5 py-1.5 text-sm cursor-pointer transition-colors ${
            value === opt.value
              ? "bg-blue-900/50 text-blue-400"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation("menu");
  const lang = (i18n.language as "en" | "fi") || "en";
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [selectedProfilePic, setSelectedProfilePic] = useState<File | null>(
    null
  );

  const userNameZ = useUserStore((state) => state.preferences?.display_name);
  const weightUnitZ = useUserStore((state) => state.preferences?.weight_unit);
  const distanceUnitZ = useUserStore(
    (state) => state.preferences?.distance_unit
  );
  const profilePicZ = useUserStore(
    (state) => state.preferences?.profile_picture
  );
  const heightCmZ = useUserStore((state) => state.preferences?.height_cm);
  const genderZ = useUserStore((state) => state.preferences?.gender);
  const birthDateZ = useUserStore((state) => state.preferences?.birth_date);

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  useEffect(() => {
    setUserName(userNameZ || "");
    setWeightUnit(weightUnitZ || "kg");
    setDistanceUnit(distanceUnitZ || "km");
    setHeightCm(heightCmZ ? String(heightCmZ) : "");
    if (heightCmZ) {
      const totalInches = heightCmZ / 2.54;
      setHeightFt(String(Math.floor(totalInches / 12)));
      setHeightIn(String(Math.round(totalInches % 12)));
    } else {
      setHeightFt("");
      setHeightIn("");
    }
    setGender(genderZ ?? null);
    setBirthDate(birthDateZ ? new Date(birthDateZ) : null);
    setSelectedProfilePic(null);
  }, [
    userNameZ,
    weightUnitZ,
    distanceUnitZ,
    profilePicZ,
    heightCmZ,
    genderZ,
    birthDateZ,
  ]);

  const saveProfilePicture = async () => {
    if (!selectedProfilePic) return null;

    const fileType = await fileTypeFromBlob(selectedProfilePic);
    if (
      !fileType ||
      !["image/jpeg", "image/png", "image/webp"].includes(fileType.mime)
    ) {
      toast.error(t("profile.profilePictureFormatError"));
      return null;
    }

    if (selectedProfilePic.size > 5 * 1024 * 1024) {
      toast.error(t("profile.profilePictureSizeError"));
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
      toast.error(t("profile.profilePictureUploadError"));
      return profilePicZ || null;
    }
  };

  const updateSettings = async () => {
    if (!userName.trim()) {
      toast.error(t("profile.userNameEmpty"));
      return;
    }

    setIsSaving(true);
    try {
      const [uploadedProfilePic, isTaken] = await Promise.all([
        saveProfilePicture(),
        validateUserName(userName),
      ]);

      if (selectedProfilePic && !uploadedProfilePic) {
        setIsSaving(false);
        return;
      }

      const profilePictureUrl = uploadedProfilePic ?? profilePicZ ?? null;

      if (isTaken) {
        setIsSaving(false);
        toast.error(t("profile.userNameTaken"));
        return;
      }

      let parsedHeight: number | null = null;
      if (distanceUnit === "mi") {
        const ft = parseFloat(heightFt) || 0;
        const inches = parseFloat(heightIn) || 0;
        if (ft > 0 || inches > 0) {
          parsedHeight = Math.round((ft * 12 + inches) * 2.54);
        }
      } else {
        parsedHeight = heightCm ? parseFloat(heightCm) : null;
      }

      const payload = {
        display_name: userName,
        weight_unit: weightUnit,
        distance_unit: distanceUnit,
        profile_picture: profilePictureUrl,
        height_cm: parsedHeight && parsedHeight > 0 ? parsedHeight : null,
        gender: gender,
        birth_date: birthDate ? birthDate.toISOString().split("T")[0] : null,
      };

      await saveUserProfile(payload);
      setPreferences(payload);
      toast.success(t("profile.updateSuccess"));
    } catch {
      toast.error(t("profile.updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto flex flex-col min-h-full">
      <div className="flex-1">
        {/* Profile picture hero */}
        <div className="flex flex-col items-center pt-2 pb-4">
          <ProfilePicture
            data={profilePicZ ? `${profilePicZ}?t=${Date.now()}` : null}
            onFileSelected={(file) => setSelectedProfilePic(file)}
            size={100}
          />
          <p className="text-xs text-slate-500 mt-2 font-body">
            {t("profile.profilePictureHint")}
          </p>
        </div>

        {/* Username */}
        <div className="mt-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1 font-body">
            {t("profile.userName")}
          </p>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4">
            <input
              type="text"
              value={userName}
              onChange={(e) =>
                setUserName(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                    .slice(0, 15)
                )
              }
              spellCheck={false}
              autoCorrect="off"
              maxLength={15}
              className="w-full bg-transparent text-gray-100 text-lg h-12 outline-none"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 px-1 font-body">
            {t("profile.userNameHint")}
          </p>
        </div>

        {/* Units section */}
        <SectionCard title={t("profile.unitsSection")}>
          <SettingsRow label={t("profile.weightUnit")}>
            <UnitToggle
              value={weightUnit}
              options={[
                { value: "kg", label: "kg" },
                { value: "lbs", label: "lbs" },
              ]}
              onChange={setWeightUnit}
            />
          </SettingsRow>
          <SettingsRow label={t("profile.distanceUnit")} isLast>
            <UnitToggle
              value={distanceUnit}
              options={[
                { value: "km", label: "km" },
                { value: "mi", label: "mi" },
              ]}
              onChange={setDistanceUnit}
            />
          </SettingsRow>
        </SectionCard>

        {/* Body section */}
        <SectionCard title={t("profile.bodySection")}>
          {/* Height */}
          <SettingsRow
            label={
              distanceUnit === "mi"
                ? t("profile.heightImperial")
                : t("profile.heightMetric")
            }
          >
            {distanceUnit === "mi" ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value.slice(0, 1))}
                  placeholder="0"
                  className="bg-slate-900 border border-slate-700 rounded-lg text-center text-gray-100 text-base w-16 h-10 outline-none"
                />
                <span className="text-xs text-slate-500 font-body">ft</span>
                <input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value.slice(0, 2))}
                  placeholder="0"
                  className="bg-slate-900 border border-slate-700 rounded-lg text-center text-gray-100 text-base w-16 h-10 ml-1 outline-none"
                />
                <span className="text-xs text-slate-500 font-body">in</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value.slice(0, 3))}
                  placeholder="0"
                  className="bg-slate-900 border border-slate-700 rounded-lg text-center text-gray-100 text-base w-20 h-10 outline-none"
                />
                <span className="text-xs text-slate-500 font-body">cm</span>
              </div>
            )}
          </SettingsRow>

          {/* Gender */}
          <SettingsRow label={t("profile.gender")}>
            <UnitToggle
              value={gender ?? ""}
              options={[
                { value: "male", label: t("profile.genderMale") },
                { value: "female", label: t("profile.genderFemale") },
              ]}
              onChange={setGender}
            />
          </SettingsRow>

          {/* Birth date */}
          <SettingsRow label={t("profile.birthDate")} isLast>
            <div className="w-48 shrink-0">
              <DatePicker
                selected={birthDate}
                onChange={(date) => setBirthDate(date)}
                locale={dateLocales[lang]}
                dateFormat={dateFormats[lang]}
                maxDate={new Date()}
                minDate={new Date(1920, 0, 1)}
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                placeholderText={t("profile.birthDatePlaceholder")}
                className="w-full p-2 rounded border-[1.5px] text-gray-100 text-sm placeholder:text-slate-400 border-slate-400 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300 cursor-pointer font-body"
                autoComplete="off"
                popperPlacement="bottom-end"
              />
            </div>
          </SettingsRow>
        </SectionCard>

        <p className="text-xs text-slate-500 mt-2 px-1 font-body">
          {t("profile.bodyHint")}
        </p>
      </div>

      <div className="mt-8 mb-2">
        <SaveButton
          onClick={updateSettings}
          label={t("profile.saveChanges")}
        />
      </div>

      {isSaving && <FullScreenLoader message={t("profile.savingProfile")} />}
    </div>
  );
}
