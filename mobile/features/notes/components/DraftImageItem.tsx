import { View, Image } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { X } from "lucide-react-native";

type Props = {
  uri: string;
  onDelete?: () => void;
  onPress?: () => void;
};

export default function DraftImageItem({ uri, onDelete, onPress }: Props) {
  return (
    <AnimatedButton
      onPress={onPress ?? (() => {})}
      className="relative mb-3 rounded-md overflow-hidden border-2 border-blue-500 bg-slate-950"
    >
      <Image
        source={{ uri }}
        className="w-full h-48"
        resizeMode="cover"
      />
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
