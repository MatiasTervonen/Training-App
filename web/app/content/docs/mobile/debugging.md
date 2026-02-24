# Debugging Native Mobile Code

This guide covers how to add debug logs to native Kotlin code and view them using Android's `adb logcat` tool.

---

## Adding Debug Logs

In the Kotlin file where you want to add debug logs, first import the Log class:

```kotlin
import android.util.Log
```

Then add log statements using `Log.d(tag, message)`:

```kotlin
Log.d("StepCounter", "Steps counted: 42")
```

- **First argument (tag)** — A label you choose to identify where the log is coming from. Use something descriptive like the module name (e.g. `"StepCounter"`, `"AlarmModule"`, `"TimerModule"`).
- **Second argument (message)** — The actual message you want to log. You can include variable values here for debugging.

There are different log levels available:

- `Log.d()` — Debug (general debugging info)
- `Log.e()` — Error (something went wrong)
- `Log.w()` — Warning (potential issues)
- `Log.i()` — Info (general information)

---

## Viewing Logs with ADB

`adb logcat` streams **all** logs from your Android device/emulator — every app, every system process. It outputs a lot, so you need to filter it.

### Quick filter with grep

Run this in a fresh terminal while your app is running:

```bash
adb logcat | grep "StepCounter"
```

This pipes all logs through `grep` and only shows lines containing your tag text. Replace `"StepCounter"` with whatever tag you used in your `Log.d()` call.

### Better: Filter at the source with -s flag

```bash
adb logcat -s StepCounter:D
```

The `-s` flag tells logcat to **only** show logs matching the given tag, instead of streaming everything and filtering after. This is more reliable than `grep` because it filters at the source.

- `StepCounter` — the tag to filter for (must match your `Log.d()` tag exactly)
- `:D` — minimum log level to show (D = Debug, E = Error, W = Warning, I = Info)

---

## Clearing Old Logs

When you start a logcat session, it may show old buffered logs from previous runs. Clear them first:

```bash
adb logcat -c
```

A typical workflow looks like:

1. `adb logcat -c` — clear old logs
2. `adb logcat -s YourTag:D` — start listening
3. Use your app to trigger the code path you want to debug
4. Read the output in your terminal

---

## Important

**Always rebuild your app after making changes to native code.** Unlike JS/TS changes which hot-reload, native Kotlin changes require a full rebuild with `npx expo run:android`.
