import AppButton from "@/app/components/button";
import { Alert } from "react-native";

const handleGuestLogin = async () => {
  try {
    const response = await fetch(
      "https://training-app-bay.vercel.app/api/guest-login",
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to log in as guest");
    }

    const data = await response.json();
    console.log("Guest login successful:", data);
  } catch (error) {
    console.error("Error logging in as guest:", error);
    Alert.alert("Failed to log in as guest. Please try again.");
  }
};
export default function GuestLogIn() {
  return (
    <AppButton
      title="Log in as a Guest"
      onPress={() => {
        handleGuestLogin();
      }}
    />
  );
}
