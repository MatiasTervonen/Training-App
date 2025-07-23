import { TextInput, View } from "react-native";
import { SquarePen } from "lucide-react-native";
import AppText from "./AppText";

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
  cols,
  label,
}: NotesInputProps) {
  return (
    <View>
      <View className="flex-row gap-2">
        <AppText className="text-sm text-gray-300 mb-1">{label}</AppText>
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
        className="rounded-md p-2 text-gray-100 bg-gray-900 border-2 border-gray-100 focus:border-green-300"
      />
    </View>
  );
}
