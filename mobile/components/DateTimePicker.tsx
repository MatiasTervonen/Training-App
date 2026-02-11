import DatePicker from "react-native-date-picker";
import { useTranslation } from "react-i18next";

export default function DateTimePicker({
  date,
  onDateChange,
  open,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  open: boolean;
}) {
  const { t, i18n } = useTranslation("common");

  return (
    <DatePicker
      date={date}
      onDateChange={onDateChange}
      open={open}
      locale={i18n.language}
      title={t("datePicker.selectTime")}
      confirmText={t("datePicker.confirm")}
      cancelText={t("datePicker.cancel")}
    />
  );
}
