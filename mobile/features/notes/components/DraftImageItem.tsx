import { View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import AnimatedButton from "@/components/buttons/animatedButton";
import { X } from "lucide-react-native";

type Props = {
  uri: string;
  isLoading?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
};

export default function DraftImageItem({ uri, isLoading, onDelete, onPress }: Props) {
  return (
    <AnimatedButton
      onPress={onPress ?? (() => {})}
      disabled={isLoading}
      className="relative mb-3 rounded-md overflow-hidden border-[1.5px] border-blue-500/60 bg-slate-950"
    >
      {isLoading ? (
        <View className="w-full h-48 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <Image
          source={{ uri }}
          className="w-full h-48"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      )}
      {onDelete && (
        <View className="absolute top-2 right-2">
          <AnimatedButton
            onPress={onDelete}
            className="bg-red-800 border-red-500 border-2 rounded-full p-1"
          >
            <X color="white" size={18} />
          </AnimatedButton>
        </View>
      )}
    </AnimatedButton>
  );
}
