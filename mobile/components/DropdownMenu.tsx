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
  onHistory?: () => void;
  onChange?: () => void;
};

export default function DropdownMenu({
  button,
  pinned,
  onEdit,
  onTogglePin,
  onDelete,
  onHistory,
  onChange,
  
}: DropdownMenuProps) {
  return (
    <View>
      <Menu>
        <MenuTrigger
          customStyles={{
            triggerWrapper: {
              padding: 8,
            },
          }}
        >
          {button}
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

          {onHistory && (
            <MenuOption onSelect={onHistory}>
              <AppText className="text-center">History</AppText>
            </MenuOption>
          )}
          {onChange && (
            <MenuOption onSelect={onChange}>
              <AppText className="text-center">Change</AppText>
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
