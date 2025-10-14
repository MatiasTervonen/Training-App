import { Bell } from "lucide-react-native";
import { View } from "react-native";

export default function NotificationBell() {
  return (
    <View className="w-[40px] h-[40px] rounded-full border-2 border-blue-500 items-center justify-center">
      <Bell size={20} color="white" />
    </View>
  );
}
