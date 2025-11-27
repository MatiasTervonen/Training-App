import GymForm from "@/components/gym/GymForm";
import { full_gym_session } from "@/types/models";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";

export default function GymScreen() {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShowForm(true));
  }, []);

  if (!showForm) {
    return (
      <View className="gap-3">
        <AppText className="text-xl text-center mt-20">
          Loading gym session...
        </AppText>
        <ActivityIndicator />
      </View>
    );
  }

  const emptySession: full_gym_session = {
    id: "",
    user_id: "",
    title: "",
    notes: "",
    duration: 0,
    created_at: new Date().toISOString(),
    gym_session_exercises: [],
  };

  return <GymForm initialData={emptySession} />;
}
