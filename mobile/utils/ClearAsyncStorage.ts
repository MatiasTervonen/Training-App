import AsyncStorage from "@react-native-async-storage/async-storage";

export async function clearAsyncStorage() {
  const keysToRemove = [
    "user-store",
    "timer-store",
    "notes_draft",
    "gym_session_draft",
    "setupData",
    "trackStats",
    "numHoles",
    "viewingHoleNumber",
    "timer_session_draft",
    "weight_draft",
    "todo_session_draft",
    "feedback_draft",
  ];

  await AsyncStorage.multiRemove(keysToRemove);
}
