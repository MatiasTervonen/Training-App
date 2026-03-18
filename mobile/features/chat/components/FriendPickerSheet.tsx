import { useRef, useMemo, useCallback, useEffect } from "react";
import { View, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { Friends } from "@/types/models";
import { useTranslation } from "react-i18next";

type FriendPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelectFriend: (friendUserId: string) => void;
};

export default function FriendPickerSheet({
  visible,
  onClose,
  onSelectFriend,
}: FriendPickerSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "80%"], []);
  const { t } = useTranslation("chat");
  const { data: friends } = useFriends();

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Friends }) => {
      const imageSource = item.user.profile_picture
        ? { uri: item.user.profile_picture }
        : require("@/assets/images/default-avatar.png");

      return (
        <Pressable
          onPress={() => onSelectFriend(item.user.id)}
          className="flex-row items-center gap-3 px-4 py-3 active:bg-slate-700"
        >
          <Image
            source={imageSource}
            className="w-10 h-10 rounded-full border-2 border-blue-500"
          />
          <AppText className="text-base">{item.user.display_name}</AppText>
        </Pressable>
      );
    },
    [onSelectFriend],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#0f172a" }}
      handleIndicatorStyle={{ backgroundColor: "#475569" }}
    >
      <View className="px-4 py-3 border-b border-slate-700/50">
        <AppText className="text-base text-center">
          {t("chat.selectFriend")}
        </AppText>
      </View>
      <BottomSheetFlatList
        data={friends ?? []}
        keyExtractor={(item: Friends) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center py-10">
            <BodyText className="text-slate-400">
              {t("chat.noFriends")}
            </BodyText>
          </View>
        }
      />
    </BottomSheetModal>
  );
}
