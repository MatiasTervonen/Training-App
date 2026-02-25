package com.layer100crypto.MyTrack.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import org.json.JSONArray

class AlarmScheduler(private val context: Context) {

    companion object {
        private const val PREFS_NAME = "alarm_repeat_prefs"
        private const val ALARM_IDS_KEY = "all_alarm_ids"
    }

    fun schedule(triggerAtMillis: Long, reminderId: String, title: String, soundType: String, content: String, tapToOpenText: String = "Tap to open timer", timesUpText: String = "Time's up!", stopAlarmText: String = "Stop Alarm", snoozeText: String = "Snooze") {
        scheduleInternal(triggerAtMillis, reminderId, title, soundType, content, tapToOpenText, timesUpText, stopAlarmText, snoozeText)
        // Clear any repeat info for one-time alarms
        clearRepeatInfo(reminderId)
        // Track this alarm ID
        addAlarmId(reminderId)
    }

    fun scheduleRepeating(
        triggerAtMillis: Long,
        reminderId: String,
        title: String,
        soundType: String,
        content: String,
        repeatType: String, // "daily" or "weekly"
        weekdays: List<Int>? = null, // 1=Sun, 2=Mon, ..., 7=Sat (for weekly)
        hour: Int,
        minute: Int,
        tapToOpenText: String = "Tap to open",
        timesUpText: String = "Reminder",
        snoozeText: String = "Snooze"
    ) {
        scheduleInternal(triggerAtMillis, reminderId, title, soundType, content, tapToOpenText, timesUpText, snoozeText = snoozeText)
        saveRepeatInfo(reminderId, title, soundType, content, repeatType, weekdays, hour, minute, tapToOpenText, timesUpText, snoozeText)
        // Track this alarm ID
        addAlarmId(reminderId)
    }

    private fun scheduleInternal(triggerAtMillis: Long, reminderId: String, title: String, soundType: String, content: String, tapToOpenText: String = "Tap to open timer", timesUpText: String = "Time's up!", stopAlarmText: String = "Stop Alarm", snoozeText: String = "Snooze") {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("REMINDER_ID", reminderId)
            putExtra("TITLE", title)
            putExtra("SOUND_TYPE", soundType)
            putExtra("CONTENT", content)
            putExtra("TAP_TO_OPEN_TEXT", tapToOpenText)
            putExtra("TIMES_UP_TEXT", timesUpText)
            putExtra("STOP_ALARM_TEXT", stopAlarmText)
            putExtra("SNOOZE_TEXT", snoozeText)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminderId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            triggerAtMillis,
            pendingIntent
        )
    }

    private fun saveRepeatInfo(
        reminderId: String,
        title: String,
        soundType: String,
        content: String,
        repeatType: String,
        weekdays: List<Int>?,
        hour: Int,
        minute: Int,
        tapToOpenText: String = "Tap to open",
        timesUpText: String = "Reminder",
        snoozeText: String = "Snooze"
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val weekdaysJson = weekdays?.let { JSONArray(it).toString() } ?: "[]"

        prefs.edit()
            .putString("${reminderId}_repeatType", repeatType)
            .putString("${reminderId}_weekdays", weekdaysJson)
            .putInt("${reminderId}_hour", hour)
            .putInt("${reminderId}_minute", minute)
            .putString("${reminderId}_title", title)
            .putString("${reminderId}_soundType", soundType)
            .putString("${reminderId}_content", content)
            .putString("${reminderId}_tapToOpenText", tapToOpenText)
            .putString("${reminderId}_timesUpText", timesUpText)
            .putString("${reminderId}_snoozeText", snoozeText)
            .apply()
    }

    fun getRepeatInfo(reminderId: String): RepeatInfo? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val repeatType = prefs.getString("${reminderId}_repeatType", null) ?: return null

        val weekdaysJson = prefs.getString("${reminderId}_weekdays", "[]") ?: "[]"
        val weekdays = mutableListOf<Int>()
        val jsonArray = JSONArray(weekdaysJson)
        for (i in 0 until jsonArray.length()) {
            weekdays.add(jsonArray.getInt(i))
        }

        return RepeatInfo(
            repeatType = repeatType,
            weekdays = weekdays,
            hour = prefs.getInt("${reminderId}_hour", 0),
            minute = prefs.getInt("${reminderId}_minute", 0),
            title = prefs.getString("${reminderId}_title", "") ?: "",
            soundType = prefs.getString("${reminderId}_soundType", "reminder") ?: "reminder",
            content = prefs.getString("${reminderId}_content", "") ?: "",
            tapToOpenText = prefs.getString("${reminderId}_tapToOpenText", "Tap to open") ?: "Tap to open",
            timesUpText = prefs.getString("${reminderId}_timesUpText", "Reminder") ?: "Reminder",
            snoozeText = prefs.getString("${reminderId}_snoozeText", "Snooze") ?: "Snooze"
        )
    }

    private fun clearRepeatInfo(reminderId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .remove("${reminderId}_repeatType")
            .remove("${reminderId}_weekdays")
            .remove("${reminderId}_hour")
            .remove("${reminderId}_minute")
            .remove("${reminderId}_title")
            .remove("${reminderId}_soundType")
            .remove("${reminderId}_content")
            .remove("${reminderId}_tapToOpenText")
            .remove("${reminderId}_timesUpText")
            .remove("${reminderId}_snoozeText")
            .apply()
    }

    fun cancel(reminderId: String) {
        val intent = Intent(context, AlarmReceiver::class.java)

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminderId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntent)
        clearRepeatInfo(reminderId)
        removeAlarmId(reminderId)
    }

    fun cancelAll() {
        val alarmIds = getAllAlarmIds()
        alarmIds.forEach { reminderId ->
            val intent = Intent(context, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                reminderId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(pendingIntent)
            clearRepeatInfo(reminderId)
        }
        clearAllAlarmIds()
    }

    fun getAllAlarmIds(): Set<String> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getStringSet(ALARM_IDS_KEY, emptySet()) ?: emptySet()
    }

    private fun addAlarmId(reminderId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentIds = prefs.getStringSet(ALARM_IDS_KEY, mutableSetOf())?.toMutableSet() ?: mutableSetOf()
        currentIds.add(reminderId)
        prefs.edit().putStringSet(ALARM_IDS_KEY, currentIds).apply()
    }

    private fun removeAlarmId(reminderId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentIds = prefs.getStringSet(ALARM_IDS_KEY, mutableSetOf())?.toMutableSet() ?: mutableSetOf()
        currentIds.remove(reminderId)
        prefs.edit().putStringSet(ALARM_IDS_KEY, currentIds).apply()
    }

    private fun clearAllAlarmIds() {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(ALARM_IDS_KEY).apply()
    }

    data class RepeatInfo(
        val repeatType: String,
        val weekdays: List<Int>,
        val hour: Int,
        val minute: Int,
        val title: String,
        val soundType: String,
        val content: String,
        val tapToOpenText: String = "Tap to open",
        val timesUpText: String = "Reminder",
        val snoozeText: String = "Snooze"
    )
}

