import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";

export default function ResendEmailText({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation("login");

  return (
    <AppText
      className="text-center text-lg mb-4 underline"
      onPress={onPress}
    >
      {t("login.resendEmail.didntGetEmail")}
    </AppText>
  );
}
