import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";

export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
