import { View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import Toggle from "@/components/toggle";
import useSharingDefaults from "@/features/sharing/hooks/useSharingDefaults";
import useUpdateSharingDefault from "@/features/sharing/hooks/useUpdateSharingDefault";
import { useTranslation } from "react-i18next";

type SettingRowProps = {
  label: string;
  isOn: boolean;
  onToggle: () => void;
};

function SettingRow({ label, isOn, onToggle }: SettingRowProps) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-slate-700">
      <AppText className="text-gray-100 flex-1 mr-4">{label}</AppText>
      <Toggle isOn={isOn} onToggle={onToggle} />
    </View>
  );
}

export default function SharingSettingsPage() {
  const { t } = useTranslation("sharing");
  const { data: defaults = [] } = useSharingDefaults();
  const { mutate: updateDefault } = useUpdateSharingDefault();

  const getDefault = (sessionType: string) =>
    defaults.find((d) => d.session_type === sessionType)?.share_with_friends ?? false;

  const toggleDefault = (sessionType: string) => {
    const current = getDefault(sessionType);
    updateDefault({ sessionType, shareWithFriends: !current });
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-4">{t("sharing.title")}</AppText>
      <AppText className="text-gray-400 text-center mb-8 leading-5">
        {t("sharing.description")}
      </AppText>

      <View>
        <SettingRow
          label={t("sharing.gymSessions")}
          isOn={getDefault("gym_sessions")}
          onToggle={() => toggleDefault("gym_sessions")}
        />
        <SettingRow
          label={t("sharing.activities")}
          isOn={getDefault("activity_sessions")}
          onToggle={() => toggleDefault("activity_sessions")}
        />
      </View>
    </PageContainer>
  );
}
