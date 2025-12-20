import DatePicker from "react-native-date-picker";

export default function DateTimePicker({
  date,
  onDateChange,
  open,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  open: boolean;
}) {
  return <DatePicker date={date} onDateChange={onDateChange} open={open} />;
}
