import { View } from "react-native";
import React from "react";
import {
  Menu,
  MenuOptions,
  MenuTrigger,
  MenuOption,
} from "react-native-popup-menu";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

type DropdownMenuProps = {
  button: React.ReactNode;
  pinned?: boolean;
  onEdit?: () => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
  onHistory?: () => void;
  onChange?: () => void;
  onMoveToFolder?: () => void;
  onHide?: () => void;
};

export default function DropdownMenu({
  button,
  pinned,
  onEdit,
  onTogglePin,
  onDelete,
  onHistory,
  onChange,
  onMoveToFolder,
  onHide,
}: DropdownMenuProps) {
  const { t } = useTranslation(["common", "feed"]);

  return (
    <View>
      <Menu onOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
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
            <MenuOption onSelect={onEdit}>
              <AppText className="text-center">{t("common.edit")}</AppText>
            </MenuOption>
          )}

          {onTogglePin && (
            <MenuOption onSelect={onTogglePin}>
              <AppText className="text-center">
                {pinned ? t("common.unpin") : t("common.pin")}
              </AppText>
            </MenuOption>
          )}

          {onMoveToFolder && (
            <MenuOption onSelect={onMoveToFolder}>
              <AppText className="text-center">{t("common.moveToFolder")}</AppText>
            </MenuOption>
          )}

          {onHide && (
            <MenuOption onSelect={onHide}>
              <AppText className="text-center">{t("feed:feed.hide.label")}</AppText>
            </MenuOption>
          )}

          {onDelete && (
            <MenuOption onSelect={onDelete}>
              <AppText className="text-center">{t("common.delete")}</AppText>
            </MenuOption>
          )}

          {onHistory && (
            <MenuOption onSelect={onHistory}>
              <AppText className="text-center">{t("common.history")}</AppText>
            </MenuOption>
          )}

          {onChange && (
            <MenuOption onSelect={onChange}>
              <AppText className="text-center">{t("common.change")}</AppText>
            </MenuOption>
          )}
        </MenuOptions>
      </Menu>
    </View>
  );
}

const optionsStyles = {
  optionsContainer: {
    backgroundColor: "#0f172a",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#475569",
    marginTop: 20,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  optionsWrapper: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
  },
  optionWrapper: {
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  optionTouchable: {
    underlayColor: "#1e3a5f",
    activeOpacity: 70,
  },
};
