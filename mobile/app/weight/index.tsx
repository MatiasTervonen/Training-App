import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AllDataTable from "@/features/weight/AllDataTable";
import { getWeight } from "@/database/weight/get-weight";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import { Plus } from "lucide-react-native";

export default function WeightScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const setModalPageConfig = useModalPageConfig((s) => s.setModalPageConfig);

  useEffect(() => {
    setModalPageConfig({
      rightLabel: t("navigation.log"),
      onSwipeLeft: () => router.push("/weight/tracking"),
    });
    return () => setModalPageConfig(null);
  }, [router, setModalPageConfig, t]);

  const {
    data: weightData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-weight"],
    queryFn: getWeight,
  });

  return (
    <>
      <AllDataTable data={weightData ?? []} isLoading={isLoading} error={error} />
      <FloatingActionButton onPress={() => router.push("/weight/tracking")} color="#f59e0b">
        <Plus size={30} color="#f59e0b" />
      </FloatingActionButton>
    </>
  );
}
