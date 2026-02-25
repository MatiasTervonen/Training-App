package com.layer100crypto.MyTrack.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.layer100crypto.MyTrack.ReactEventEmitter
import com.layer100crypto.MyTrack.timer.TimerService

class SnoozeAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Stop the current alarm
        context.stopService(Intent(context, AlarmService::class.java))

        // Read alarm context from intent extras
        val reminderId = intent.getStringExtra("REMINDER_ID") ?: return
        val title = intent.getStringExtra("TITLE") ?: "Alarm"
        val soundType = intent.getStringExtra("SOUND_TYPE") ?: "default"
        val content = intent.getStringExtra("CONTENT") ?: ""
        val tapToOpenText = intent.getStringExtra("TAP_TO_OPEN_TEXT") ?: "Tap to open"
        val timesUpText = intent.getStringExtra("TIMES_UP_TEXT") ?: "Time's up!"
        val stopAlarmText = intent.getStringExtra("STOP_ALARM_TEXT") ?: "Stop Alarm"
        val snoozeText = intent.getStringExtra("SNOOZE_TEXT") ?: "Snooze"
        val snoozeDurationMinutes = intent.getIntExtra("SNOOZE_DURATION_MINUTES", 5)

        // Schedule a new alarm N minutes from now, reusing the same ID
        val triggerAtMillis = System.currentTimeMillis() + snoozeDurationMinutes * 60 * 1000L

        AlarmScheduler(context).schedule(
            triggerAtMillis = triggerAtMillis,
            reminderId = reminderId,
            title = title,
            soundType = soundType,
            content = content,
            tapToOpenText = tapToOpenText,
            timesUpText = timesUpText,
            stopAlarmText = stopAlarmText,
            snoozeText = snoozeText
        )

        // Notify JS to update DB for global reminders
        if (soundType == "global-reminder") {
            ReactEventEmitter.sendGlobalReminderSnoozed(
                context,
                reminderId,
                snoozeDurationMinutes
            )
        }

        // Start countdown notification for timers
        if (soundType == "timer") {
            val timerIntent = Intent(context, TimerService::class.java).apply {
                putExtra("startTime", triggerAtMillis)
                putExtra("label", title)
                putExtra("mode", "countdown")
            }
            context.startForegroundService(timerIntent)

            // Notify JS to update timer state
            ReactEventEmitter.sendTimerSnoozed(
                context,
                triggerAtMillis,
                snoozeDurationMinutes * 60,
                title
            )
        }
    }
}
