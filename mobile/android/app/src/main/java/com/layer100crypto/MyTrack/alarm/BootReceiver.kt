package com.layer100crypto.MyTrack.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import com.layer100crypto.MyTrack.step.StepTrackingService
import java.util.Calendar

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed, rescheduling alarms...")
            rescheduleAlarms(context)

            // Start step tracking foreground service
            Log.d(TAG, "Starting step tracking service...")
            val serviceIntent = Intent(context, StepTrackingService::class.java)
            ContextCompat.startForegroundService(context, serviceIntent)
        }
    }

    private fun rescheduleAlarms(context: Context) {
        val scheduler = AlarmScheduler(context)
        val alarmIds = scheduler.getAllAlarmIds()

        Log.d(TAG, "Found ${alarmIds.size} alarms to reschedule")

        alarmIds.forEach { reminderId ->
            val repeatInfo = scheduler.getRepeatInfo(reminderId)

            if (repeatInfo != null) {
                // This is a repeating alarm (daily or weekly)
                val triggerTime = calculateNextTriggerTime(
                    repeatInfo.repeatType,
                    repeatInfo.weekdays,
                    repeatInfo.hour,
                    repeatInfo.minute
                )

                scheduler.scheduleRepeating(
                    triggerAtMillis = triggerTime,
                    reminderId = reminderId,
                    title = repeatInfo.title,
                    soundType = repeatInfo.soundType,
                    content = repeatInfo.content,
                    repeatType = repeatInfo.repeatType,
                    weekdays = repeatInfo.weekdays,
                    hour = repeatInfo.hour,
                    minute = repeatInfo.minute,
                    snoozeText = repeatInfo.snoozeText
                )

                Log.d(TAG, "Rescheduled repeating alarm: $reminderId (${repeatInfo.repeatType})")
            } else {
                // One-time alarm - can't reschedule without trigger time
                // Will be synced when app opens
                Log.d(TAG, "Skipping one-time alarm: $reminderId (will sync on app open)")
            }
        }
    }

    private fun calculateNextTriggerTime(
        repeatType: String,
        weekdays: List<Int>,
        hour: Int,
        minute: Int
    ): Long {
        val now = Calendar.getInstance()
        val trigger = Calendar.getInstance()
        trigger.set(Calendar.HOUR_OF_DAY, hour)
        trigger.set(Calendar.MINUTE, minute)
        trigger.set(Calendar.SECOND, 0)
        trigger.set(Calendar.MILLISECOND, 0)

        when (repeatType) {
            "daily" -> {
                // If time has passed today, schedule for tomorrow
                if (trigger.timeInMillis <= now.timeInMillis) {
                    trigger.add(Calendar.DAY_OF_MONTH, 1)
                }
            }
            "weekly" -> {
                if (weekdays.isEmpty()) {
                    // Fallback to tomorrow if no weekdays specified
                    trigger.add(Calendar.DAY_OF_MONTH, 1)
                } else {
                    // Find next matching weekday
                    // weekdays format: 1=Sun, 2=Mon, ..., 7=Sat
                    // Calendar format: 1=Sun, 2=Mon, ..., 7=Sat (same!)
                    val currentDay = now.get(Calendar.DAY_OF_WEEK)

                    var daysToAdd = 7
                    for (i in 0..7) {
                        val checkDay = ((currentDay - 1 + i) % 7) + 1
                        if (weekdays.contains(checkDay)) {
                            if (i == 0) {
                                // Today - check if time has passed
                                if (trigger.timeInMillis > now.timeInMillis) {
                                    daysToAdd = 0
                                    break
                                }
                            } else {
                                daysToAdd = i
                                break
                            }
                        }
                    }
                    trigger.add(Calendar.DAY_OF_MONTH, daysToAdd)
                }
            }
        }

        return trigger.timeInMillis
    }
}
