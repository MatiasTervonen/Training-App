import { View } from "react-native";
import React from "react";
import {
  Menu,
  MenuOptions,
  MenuTrigger,
  MenuOption,
} from "react-native-popup-menu";
import AppText from "./AppText";

type DropdownMenuProps = {
  button: React.ReactNode;
  pinned?: boolean;
  onEdit?: () => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
};

export default function DropdownMenu({
  button,
  pinned,
  onEdit,
  onTogglePin,
  onDelete,
}: DropdownMenuProps) {
  return (
    <View>
      <Menu>
        <MenuTrigger>
          <View>{button}</View>
        </MenuTrigger>
        <MenuOptions customStyles={optionsStyles}>
          {onEdit && (
            <View className="border-b border-gray-300">
              <MenuOption onSelect={onEdit}>
                <AppText className="text-center">Edit</AppText>
              </MenuOption>
            </View>
          )}

          {onTogglePin && (
            <View className="border-b border-gray-300">
              <MenuOption onSelect={onTogglePin}>
                <AppText className="text-center">
                  {pinned ? "Unpin" : "Pin"}
                </AppText>
              </MenuOption>
            </View>
          )}

          {onDelete && (
            <MenuOption onSelect={onDelete}>
              <AppText className="text-center">Delete</AppText>
            </MenuOption>
          )}
        </MenuOptions>
      </Menu>
    </View>
  );
}

const optionsStyles = {
  optionsContainer: {
    backgroundColor: "#f3f4f6",
    padding: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  optionsWrapper: {
    backgroundColor: "#1e2939",
    borderRadius: 8,
  },
  optionWrapper: {
    margin: 5,
  },
  optionTouchable: {
    underlayColor: "gold",
    activeOpacity: 70,
  },
};
