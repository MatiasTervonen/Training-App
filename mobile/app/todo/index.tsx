import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import { List } from "lucide-react-native";

export default function TodoScreen() {
  return (
    <View className="px-5 max-w-md mx-auto w-full gap-5">
      <AppText className="text-2xl text-center my-5">Todo</AppText>
      <LinkButton label="Create Todo List" href="/todo/create-todo" />

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label="My Todo Lists" href="/todo/my-todo-lists">
        <List color="#f3f4f6" className="ml-2" />
      </LinkButton>
    </View>
  );
}
