import { ChevronRight, Trash2 } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import AppText from "../AppText";
import { weight } from "@/types/models";
import { View, Pressable } from "react-native";
import { useEffect } from "react";

type RowAllDataProps = {
  item: weight;
  weightUnit: string;
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
  expanded: boolean;
};

export default function WeightRow({
  item,
  weightUnit,
  onDelete,
  onExpand,
  expanded,
}: RowAllDataProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(expanded ? 90 : 0);
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View key={item.id}>
      <View className="border-b border-gray-700 px-4 py-3 bg-gray-900">
        <View className="flex-row justify-between items-center">
          <AppText className="text-white text-lg min-w-[70px]">
            {item.weight} {weightUnit}
          </AppText>
          <AppText className="text-gray-400">
            {new Date(item.created_at).toLocaleDateString()}
          </AppText>

          <Pressable
            onPress={() => {
              onExpand(item.id);
              rotation.value = withSpring(rotation.value === 0 ? 90 : 0);
            }}
          >
            <Animated.View style={[chevronStyle]}>
              <ChevronRight size={20} color="white" />
            </Animated.View>
          </Pressable>
        </View>
      </View>
      {expanded && (
        <View className="bg-gray-800 px-6 py-3 flex-row justify-between items-center ">
          <AppText className="text-gray-300">
            {item.notes || "No notes..."}
          </AppText>
          <Pressable onPress={async () => onDelete(item.id)}>
            <Trash2 size={20} color="#d1d5db" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
