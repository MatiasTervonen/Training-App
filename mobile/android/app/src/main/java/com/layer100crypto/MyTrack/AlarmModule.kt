package com.layer100crypto.MyTrack

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.provider.Settings

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "NativeAlarm")
class NativeAlarmModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NativeAlarm"

    @ReactMethod
    fun scheduleAlarm(timestamp: Double, reminderId: String) {
        AlarmScheduler(reactContext).schedule(timestamp.toLong(), reminderId)
    }

    @ReactMethod
    fun cancelAlarm(reminderId: String) {
        AlarmScheduler(reactContext).cancel(reminderId)
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