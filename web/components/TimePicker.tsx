"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../ui/datepicker-custom.css";
import { fi } from "date-fns/locale/fi";
import { enUS } from "date-fns/locale/en-US";
import { useTranslation } from "react-i18next";

const locales = { en: enUS, fi: fi };
const timeFormats = {
  en: "h:mm aa",
  fi: "HH:mm",
};

type Props = {
  value: string | null;
  onChange: (time: string) => void;
  className?: string;
};

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function TimePicker({ value, onChange, className }: Props) {
  const { i18n } = useTranslation();
  const lang = (i18n.language as "en" | "fi") || "en";

  const selected = value ? timeStringToDate(value) : null;

  return (
    <DatePicker
      selected={selected}
      onChange={(date: Date | null) => {
        if (date) onChange(dateToTimeString(date));
      }}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={5}
      timeCaption={lang === "fi" ? "Aika" : "Time"}
      locale={locales[lang]}
      dateFormat={timeFormats[lang]}
      className={className ?? "w-20 p-1 text-center rounded border border-slate-600 text-gray-100 bg-slate-800 text-sm cursor-pointer hover:border-slate-400 focus:outline-none focus:border-green-300"}
    />
  );
}
