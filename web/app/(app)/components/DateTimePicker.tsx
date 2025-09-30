"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
        dateFormat="MMMM d, yyyy h:mm aa"
        className="w-full p-2 rounded border-2 text-gray-100 placeholder:text-slate-400 border-slate-400 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
        placeholderText={placeholder}
      />
    </div>
  );
}
