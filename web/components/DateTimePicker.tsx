"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../ui/datepicker-custom.css";
import { fi } from "date-fns/locale/fi";
import { enUS } from "date-fns/locale/en-US";
import { useTranslation } from "react-i18next";

const locales = { en: enUS, fi: fi };
const dateFormats = {
  en: "MMMM d, yyyy h:mm aa",
  fi: "d. MMMM yyyy HH:mm",
};

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  id?: string;
  label?: string;
  placeholder?: string;
};

export default function DateTimePicker({
  value,
  onChange,
  id = "datetime-picker",
  label = "Select Date and Time",
  placeholder = "Select date and time",
}: Props) {
  const { i18n } = useTranslation();
  const lang = (i18n.language as "en" | "fi") || "en";

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-gray-300 mb-1 text-sm">
        {label}
      </label>
      <DatePicker
        id={id}
        selected={value}
        onChange={onChange}
        showTimeSelect
        timeIntervals={1}
        autoComplete="off"
        locale={locales[lang]}
        dateFormat={dateFormats[lang]}
        timeCaption={lang === "fi" ? "Aika" : "Time"}
        className="w-full p-2 rounded border-2 text-gray-100 placeholder:text-slate-400 border-slate-400 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
        placeholderText={placeholder}
      />
    </div>
  );
}
