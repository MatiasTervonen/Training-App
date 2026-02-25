package com.layer100crypto.MyTrack.alarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.provider.Settings

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "NativeAlarm")
class AlarmModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NativeAlarm"

    @ReactMethod
    fun scheduleAlarm(timestamp: Double, reminderId: String, title: String, soundType: String, content: String, tapToOpenText: String, timesUpText: String, stopAlarmText: String, snoozeText: String) {
        AlarmScheduler(reactContext).schedule(timestamp.toLong(), reminderId, title, soundType, content, tapToOpenText, timesUpText, stopAlarmText, snoozeText)
    }

    @ReactMethod
    fun scheduleRepeatingAlarm(
        timestamp: Double,
        reminderId: String,
        title: String,
        soundType: String,
        content: String,
        repeatType: String,
        weekdays: ReadableArray?,
        hour: Int,
        minute: Int
    ) {
        val weekdaysList = weekdays?.let { array ->
            (0 until array.size()).map { array.getInt(it) }
        }

        AlarmScheduler(reactContext).scheduleRepeating(
            triggerAtMillis = timestamp.toLong(),
            reminderId = reminderId,
            title = title,
            soundType = soundType,
            content = content,
            repeatType = repeatType,
            weekdays = weekdaysList,
            hour = hour,
            minute = minute
        )
    }

    @ReactMethod
    fun cancelAlarm(reminderId: String) {
        AlarmScheduler(reactContext).cancel(reminderId)
    }

    @ReactMethod
    fun cancelAllAlarms() {
        AlarmScheduler(reactContext).cancelAll()
    }

    @ReactMethod
    fun stopAlarm() {
        reactContext.stopService(Intent(reactContext, AlarmService::class.java))
    }

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        val alarmManager =
            reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        promise.resolve(alarmManager.canScheduleExactAlarms())
    }

    @ReactMethod
    fun requestExactAlarmPermission() {
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactContext.startActivity(intent)
    }
}

