"use client";

import GymForm from "@/features/gym/components/GymForm";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import { full_gym_session } from "@/types/models";
import { useParams } from "next/navigation";
import Spinner from "@/components/spinner";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function EditGymPage() {
  const { t } = useTranslation("gym");
  const { id } = useParams() as { id: string };

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", id],
    queryFn: () => getFullGymSession(id!),
    enabled: !!id,
  });

  if (isLoadingGymSession) {
    return (
      <div className="flex flex-col justify-center items-center gap-3">
        <p className="text-xl text-center mt-20">{t("gym.mySessions.loadingDetails")}</p>
        <Spinner />
      </div>
    );
  }

  if (GymSessionError) {
    toast.error(t("gym.mySessions.loadDetailsError"));
  }

  return <GymForm initialData={GymSessionFull!} />;
}
