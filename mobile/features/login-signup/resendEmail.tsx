import BodyText from "@/components/BodyText";
import { useTranslation } from "react-i18next";

export default function ResendEmailText({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation("login");

  return (
    <BodyText className="text-center text-lg mb-4 underline" onPress={onPress}>
      {t("login.resendEmail.didntGetEmail")}
    </BodyText>
  );
}
