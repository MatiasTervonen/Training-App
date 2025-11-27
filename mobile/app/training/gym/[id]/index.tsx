import GymForm from "@/components/gym/GymForm";
import { useLocalSearchParams } from "expo-router";
import { full_gym_session } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/api/gym/get-full-gym-session";
import Toast from "react-native-toast-message";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";

export default function EditGymScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    // Wait one frame so navigation transition can complete
    requestAnimationFrame(() => {
      setShowForm(true);
    });
  }, []);

  if (isLoadingGymSession || !showForm) {
    return (
      <View className="gap-3">
        <AppText className="text-xl text-center mt-20">
          Loading gym session...
        </AppText>
        <ActivityIndicator />
      </View>
    );
  }

  if (GymSessionError) {
    Toast.show({
      type: "error",
      text1: "Failed to load session",
      text2: "Something went wrong. Please try again.",
    });
  }

  return <GymForm initialData={GymSessionFull!} />;
}
