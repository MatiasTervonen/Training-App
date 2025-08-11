import { View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import AppText from "./AppText";
import { SquarePen } from "lucide-react-native";

type NotesInputProps = {
  notes: string;
  setNotes: (value: string) => void;
  placeholder: string;
  rows?: number;
  cols?: number;
  label?: string;
};

export default function NotesInput({
  notes,
  setNotes,
  placeholder,
  rows,
  label,
}: NotesInputProps) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center mb-2 gap-1">
        <AppText className="text-sm text-gray-300">{label}</AppText>
        <SquarePen size={18} color="#f3f4f6" />
      </View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={"#9ca3af"}
        value={notes}
        onChangeText={setNotes}
        autoComplete="off"
        spellCheck={false}
        multiline
        numberOfLines={rows || 5}
        style={{
          flex: 1,
          height: (rows || 5) * 24,
          textAlignVertical: "top",
        }}
        className="border-2 pl-3 border-gray-300 rounded-lg text-gray-100 bg-slate-900 focus:border-green-500 font-russo"
      />
    </View>
  );
}
