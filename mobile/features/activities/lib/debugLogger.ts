import { File, Paths } from "expo-file-system";

type LogEvent = {
  time: string;
  tag: string;
  message: string;
};

const MAX_EVENTS = 300;
const FLUSH_EVERY = 5;

let events: LogEvent[] = [];
let unflushedCount = 0;

function getLogFile() {
  return new File(Paths.document, "gps-debug.log");
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

export function debugLog(tag: string, message: string) {
  const event: LogEvent = {
    time: formatTime(new Date()),
    tag,
    message,
  };

  events.push(event);
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }

  unflushedCount++;
  if (unflushedCount >= FLUSH_EVERY) {
    flushToFile();
  }
}

export function getLogEvents(): LogEvent[] {
  return events;
}

export function getLogText(): string {
  return events
    .map((e) => `${e.time} [${e.tag.padEnd(14)}] ${e.message}`)
    .join("\n");
}

export function clearLog() {
  events = [];
  unflushedCount = 0;
  try {
    const file = getLogFile();
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Silently fail
  }
}

function flushToFile() {
  unflushedCount = 0;
  try {
    const file = getLogFile();
    file.write(getLogText());
  } catch {
    // Silently fail — don't break the app for logging
  }
}

/** Force flush (call before copying log) */
export function forceFlush() {
  unflushedCount = 0;
  try {
    const file = getLogFile();
    file.write(getLogText());
  } catch {
    // Silently fail
  }
}
