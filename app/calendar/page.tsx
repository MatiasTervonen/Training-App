"use client";

import Calendar from "react-calendar";
import { useState } from "react";
import "react-calendar/dist/Calendar.css";

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col flex-grow items-center  w-full">
        <h1 className="text-2xl font-bold m-4">My Calendar</h1>
        <div className="bg-slate-800 p-4 rounded-md shadow-md">
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
