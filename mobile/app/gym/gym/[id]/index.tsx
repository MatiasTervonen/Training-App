import GymForm from "@/features/gym/GymForm";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import Toast from "react-native-toast-message";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";

export default function EditGymScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery({
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
