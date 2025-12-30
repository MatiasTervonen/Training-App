"use client";

import GymForm from "@/app/(app)/gym/components/GymForm";
import { getFullGymSession } from "@/app/(app)/database/gym/get-full-gym-session";
import { full_gym_session } from "@/app/(app)/types/models";
import { useParams } from "next/navigation";
import Spinner from "@/app/(app)/components/spinner";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

export default function EditGymPage() {
  const { id } = useParams() as { id: string };

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", id],
    queryFn: () => getFullGymSession(id!),
    enabled: !!id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (isLoadingGymSession) {
    return (
      <div className="flex flex-col justify-center items-center gap-3">
        <p className="text-xl text-center mt-20">Loading gym session...</p>
        <Spinner />
      </div>
    );
  }

  if (GymSessionError) {
    toast.error("Failed to load session, Please try again.");
  }

  return <GymForm initialData={GymSessionFull!} />;
}
