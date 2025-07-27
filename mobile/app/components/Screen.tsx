import { ScrollView } from "react-native";

export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
