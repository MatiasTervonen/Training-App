import GymForm from "@/features/gym/GymForm";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import Toast from "react-native-toast-message";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";

export default function EditGymScreen() {
  const { t } = useTranslation("gym");
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
          {t("gym.editScreen.loadingSession")}
        </AppText>
        <ActivityIndicator />
      </View>
    );
  }

  if (GymSessionError) {
    Toast.show({
      type: "error",
      text1: t("gym.editScreen.loadError"),
      text2: t("gym.editScreen.loadErrorSub"),
    });
  }

  return <GymForm initialData={GymSessionFull!} />;
}
