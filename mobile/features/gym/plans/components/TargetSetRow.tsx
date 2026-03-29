import { View, TextInput } from "react-native";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Trash2 } from "lucide-react-native";

type TargetSet = {
  target_weight: string;
  target_reps: string;
  target_rpe: string;
};

type Props = {
  setNumber: number;
  value: TargetSet;
  onChange: (field: keyof TargetSet, value: string) => void;
  onDelete: () => void;
};

export default function TargetSetRow({ setNumber, value, onChange, onDelete }: Props) {
  return (
    <View className="flex-row items-center">
      <View className="flex-1 items-center">
        <AppTextNC className="text-slate-400 text-sm">
          {setNumber}
        </AppTextNC>
      </View>
      <View className="flex-1 items-center px-1">
        <TextInput
          value={value.target_weight}
          onChangeText={(v) => onChange("target_weight", v)}
          placeholder="kg"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          className="w-full bg-slate-800/80 border border-slate-700 rounded px-2 py-1.5 text-gray-100 text-sm font-lexend text-center"
        />
      </View>
      <View className="flex-1 items-center px-1">
        <TextInput
          value={value.target_reps}
          onChangeText={(v) => onChange("target_reps", v)}
          placeholder="×"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          className="w-full bg-slate-800/80 border border-slate-700 rounded px-2 py-1.5 text-gray-100 text-sm font-lexend text-center"
        />
      </View>
      <View className="flex-1 items-center px-1">
        <TextInput
          value={value.target_rpe}
          onChangeText={(v) => onChange("target_rpe", v)}
          placeholder="RPE"
          placeholderTextColor="#64748b"
          className="w-full bg-slate-800/80 border border-slate-700 rounded px-2 py-1.5 text-gray-100 text-sm font-lexend text-center"
        />
      </View>
      <View className="w-8 items-center">
        <AnimatedButton onPress={onDelete} hitSlop={8}>
          <Trash2 size={14} color="#64748b" />
        </AnimatedButton>
      </View>
    </View>
  );
}
