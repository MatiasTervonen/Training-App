"use client";

import Calendar from "react-calendar";
import { useState } from "react";
import "react-calendar/dist/Calendar.css";

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)] bg-slate-800 text-gray-100">
      <div className="flex flex-col flex-grow items-center  w-full">
        <h1 className="text-2xl m-4">My Calendar</h1>
        <div className="bg-slate-900 p-4 rounded-md shadow-md">
          <Calendar
            onChange={(value) => setDate(value as Date)}
            value={date}
            className="bg-slate-900 text-slate-900"
          />
        </div>
      </div>
    </div>
  );
}
