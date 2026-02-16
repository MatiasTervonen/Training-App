import { View, Pressable } from "react-native";
import AppText from "@/components/AppText";
import { ChevronDown, ChevronUp, Check } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

type FolderPickerProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  isLoading: boolean;
};

export default function FolderPicker({
  folders,
  selectedFolderId,
  onSelect,
  isLoading,
}: FolderPickerProps) {
  const { t } = useTranslation("notes");
  const [isOpen, setIsOpen] = useState(false);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const displayName = selectedFolder?.name ?? t("notes.folders.unfiled");

  if (isLoading) {
    return (
      <View className="mt-4">
        <AppText className="text-sm text-slate-400 mb-1">
          {t("notes.folders.saveToFolder")}
        </AppText>
        <View className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 animate-pulse">
          <View className="h-5 bg-slate-700 rounded w-32" />
        </View>
      </View>
    );
  }

  if (folders.length === 0) return null;

  return (
    <View className="mt-4">
      <AppText className="text-sm text-slate-400 mb-1">
        {t("notes.folders.saveToFolder")}
      </AppText>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 flex-row items-center justify-between"
      >
        <AppText className="text-slate-200">{displayName}</AppText>
        {isOpen ? (
          <ChevronUp size={18} color="#94a3b8" />
        ) : (
          <ChevronDown size={18} color="#94a3b8" />
        )}
      </Pressable>

      {isOpen && (
        <View className="bg-slate-800 border border-slate-600 rounded-lg mt-1 overflow-hidden">
          <Pressable
            onPress={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className={`px-4 py-3 flex-row items-center justify-between border-b border-slate-700 ${
              !selectedFolderId ? "bg-slate-700" : ""
            }`}
          >
            <AppText className="text-slate-200">
              {t("notes.folders.unfiled")}
            </AppText>
            {!selectedFolderId && <Check size={16} color="#3b82f6" />}
          </Pressable>

          {folders.map((folder) => (
            <Pressable
              key={folder.id}
              onPress={() => {
                onSelect(folder.id);
                setIsOpen(false);
              }}
              className={`px-4 py-3 flex-row items-center justify-between border-b border-slate-700 ${
                selectedFolderId === folder.id ? "bg-slate-700" : ""
              }`}
            >
              <AppText className="text-slate-200">{folder.name}</AppText>
              {selectedFolderId === folder.id && (
                <Check size={16} color="#3b82f6" />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
