package com.layer100crypto.MyTrack.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import androidx.core.content.ContextCompat
import com.layer100crypto.MyTrack.AppForegroundState
import com.layer100crypto.MyTrack.ReactEventEmitter
import com.layer100crypto.MyTrack.timer.TimerService
import java.util.Calendar

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {

        val reminderId = intent.getStringExtra("REMINDER_ID") ?: return
        val title = intent.getStringExtra("TITLE") ?: "Alarm"
        val soundType = intent.getStringExtra("SOUND_TYPE") ?: "default"
        val content = intent.getStringExtra("CONTENT") ?: ""
        val tapToOpenText = intent.getStringExtra("TAP_TO_OPEN_TEXT") ?: "Tap to open timer"
        val timesUpText = intent.getStringExtra("TIMES_UP_TEXT") ?: "Time's up!"
        val stopAlarmText = intent.getStringExtra("STOP_ALARM_TEXT") ?: "Stop Alarm"

        val isAppInForeground = AppForegroundState.isForeground()

        // Check if screen is off or locked
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val isScreenOn = powerManager.isInteractive

        // Stop the timer countdown notification — the alarm replaces it
        if (soundType == "timer") {
            context.stopService(Intent(context, TimerService::class.java))
        }

        // For timers: JS handles the alarm when in foreground AND screen is on
        // For reminders: Always use native alarm (no JS handling exists)
        val shouldStartService = soundType == "reminder" || !isAppInForeground || !isScreenOn

        if (shouldStartService) {
            val serviceIntent = Intent(context, AlarmService::class.java).apply {
                putExtra("REMINDER_ID", reminderId)
                putExtra("TITLE", title)
                putExtra("SOUND_TYPE", soundType)
                putExtra("CONTENT", content)
                putExtra("TAP_TO_OPEN_TEXT", tapToOpenText)
                putExtra("TIMES_UP_TEXT", timesUpText)
                putExtra("STOP_ALARM_TEXT", stopAlarmText)
            }
            ContextCompat.startForegroundService(context, serviceIntent)
        }

        // Launch AlarmActivity directly when screen is on for ALL alarm types.
        // On Samsung One UI the heads-up notification auto-collapses after a few seconds,
        // so we bypass it and show the full-screen alarm UI directly.
        // When screen is off/locked, the fullScreenIntent from the notification handles it.
        // For timers with the app in foreground, JS already handles the UI (see above).
        val jsHandlesAlarm = isAppInForeground && isScreenOn && soundType != "reminder"
        if (isScreenOn && !jsHandlesAlarm) {
            val alarmActivityIntent = Intent(context, AlarmActivity::class.java).apply {
                putExtra("REMINDER_ID", reminderId)
                putExtra("TITLE", title)
                putExtra("SOUND_TYPE", soundType)
                putExtra("CONTENT", content)
                putExtra("TAP_TO_OPEN_TEXT", tapToOpenText)
                putExtra("TIMES_UP_TEXT", timesUpText)
                putExtra("STOP_ALARM_TEXT", stopAlarmText)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(alarmActivityIntent)
        }

        // Notify JS if app is in foreground and screen is on (for timer sound/UI)
        if (isAppInForeground && isScreenOn && soundType != "reminder") {
            ReactEventEmitter.sendTimerFinished(context, reminderId, title)
        }

        // Schedule next occurrence for repeating alarms
        scheduleNextRepeat(context, reminderId)
    }

    private fun scheduleNextRepeat(context: Context, reminderId: String) {
        val scheduler = AlarmScheduler(context)
        val repeatInfo = scheduler.getRepeatInfo(reminderId) ?: return

        val nextTriggerTime = calculateNextTriggerTime(repeatInfo)
        if (nextTriggerTime > 0) {
            scheduler.scheduleRepeating(
                triggerAtMillis = nextTriggerTime,
                reminderId = reminderId,
                title = repeatInfo.title,
                soundType = repeatInfo.soundType,
                content = repeatInfo.content,
                repeatType = repeatInfo.repeatType,
                weekdays = repeatInfo.weekdays,
                hour = repeatInfo.hour,
                minute = repeatInfo.minute
            )
        }
    }

    private fun calculateNextTriggerTime(repeatInfo: AlarmScheduler.RepeatInfo): Long {
        val calendar = Calendar.getInstance()

        return when (repeatInfo.repeatType) {
            "daily" -> {
                // Set to next day at the specified time
                calendar.set(Calendar.HOUR_OF_DAY, repeatInfo.hour)
                calendar.set(Calendar.MINUTE, repeatInfo.minute)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
                calendar.add(Calendar.DAY_OF_YEAR, 1)
                calendar.timeInMillis
            }
            "weekly" -> {
                if (repeatInfo.weekdays.isEmpty()) return 0

                val now = Calendar.getInstance()
                val currentDayOfWeek = now.get(Calendar.DAY_OF_WEEK) // 1=Sun, 7=Sat

                // Find the next weekday that matches
                var daysToAdd = 7 // Default to 7 days if no match found
                for (i in 1..7) {
                    val checkDay = ((currentDayOfWeek - 1 + i) % 7) + 1
                    if (repeatInfo.weekdays.contains(checkDay)) {
                        daysToAdd = i
                        break
                    }
                }

                calendar.set(Calendar.HOUR_OF_DAY, repeatInfo.hour)
                calendar.set(Calendar.MINUTE, repeatInfo.minute)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
                calendar.add(Calendar.DAY_OF_YEAR, daysToAdd)
                calendar.timeInMillis
            }
            else -> 0
        }
    }
}

