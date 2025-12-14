"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function useSaveDraft({
  title,
  notes,
  setTitle,
  setNotes,
  setIsLoaded,
  isLoaded,
  setAlarmMinutes,
  setAlarmSeconds,
  alarmMinutes,
  alarmSeconds,
}: {
  title: string;
  notes: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
  setAlarmMinutes: (alarmMinutes: string) => void;
  setAlarmSeconds: (alarmSeconds: string) => void;
  alarmMinutes: string;
  alarmSeconds: string;
}) {
  useEffect(() => {
    const draft = localStorage.getItem("timer_session_draft");
    if (draft) {
      const {
        title: savedTitle,
        notes: savedNotes,
        durationInSeconds: savedAlarmDuration,
      } = JSON.parse(draft);
      if (savedTitle) setTitle(savedTitle);
      if (savedNotes) setNotes(savedNotes);
      if (savedAlarmDuration)
        setAlarmMinutes(Math.floor(savedAlarmDuration / 60).toString());
      if (savedAlarmDuration)
        setAlarmSeconds((savedAlarmDuration % 60).toString());
    }
    setIsLoaded(true);
  }, [setAlarmMinutes, setAlarmSeconds, setIsLoaded, setNotes, setTitle]);

  const saveDraft = useDebouncedCallback(
    () => {
      if (!isLoaded) return;

      if (
        title.trim() === "" &&
        alarmMinutes.trim() === "" &&
        alarmSeconds.trim() === ""
      ) {
        localStorage.removeItem("timer_session_draft");
        return;
      }

      const minutes = parseInt(alarmMinutes) || 0;
      const seconds = parseInt(alarmSeconds) || 0;
      const totalSeconds = minutes * 60 + seconds;

      const sessionDraft = {
        title: title,
        notes: notes,
        durationInSeconds: totalSeconds,
      };
      localStorage.setItem("timer_session_draft", JSON.stringify(sessionDraft));
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveDraft();
  }, [title, alarmMinutes, alarmSeconds, notes, saveDraft]);
  return {
    saveDraft,
  };
}
