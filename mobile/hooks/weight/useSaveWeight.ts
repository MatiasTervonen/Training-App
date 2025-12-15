import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveWeight } from "@/database/weight/save-weight";

export default function useSaveWeight({
  title,
  notes,
  weight,
  setIsSaving,
  resetWeight,
}: {
  title: string;
  notes: string;
  weight: string;
  setIsSaving: (isSaving: boolean) => void;
  resetWeight: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveWeight = async () => {
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Title",
        text2: "Please enter a title for your weight entry.",
      });
      return;
    }

    if (!weight.trim() || isNaN(Number(weight))) {
      Toast.show({
        type: "error",
        text1: "Invalid Weight",
        text2: "Please enter a valid numeric weight.",
      });
      return;
    }
    setIsSaving(true);

    try {
      await saveWeight({ title, notes, weight: Number(weight) });

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["get-weight"],
          exact: true,
        }),
        queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
      ]);

      router.push("/dashboard");
      resetWeight();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Weight saved successfully!",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save weights. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveWeight,
  };
}
