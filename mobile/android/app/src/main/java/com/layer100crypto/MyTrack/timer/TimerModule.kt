package com.layer100crypto.MyTrack.timer

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TimerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NativeTimer"

    @ReactMethod
    fun startTimer(startTime: Double, label: String?, mode: String, statusText: String?, pauseText: String?, extendText: String?) {
        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("startTime", startTime.toLong())
        intent.putExtra("label", label ?: "Session")
        intent.putExtra("mode", mode)
        intent.putExtra("pauseText", pauseText ?: "Stop")
        intent.putExtra("extendText", extendText ?: "+1 min")
        reactApplicationContext.startForegroundService(intent)
    }

    @ReactMethod
    fun updateTimerLabel(startTime: Double, label: String?, mode: String, statusText: String?, pauseText: String?, extendText: String?) {
        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("startTime", startTime.toLong())
        intent.putExtra("label", label ?: "Session")
        intent.putExtra("mode", mode)
        intent.putExtra("pauseText", pauseText ?: "Stop")
        intent.putExtra("extendText", extendText ?: "+1 min")
        reactApplicationContext.startForegroundService(intent)
    }

    @ReactMethod
    fun pauseTimer(frozenTime: String?, pausedLabel: String?, resumeText: String?) {
        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("action", "pause")
        intent.putExtra("frozenTime", frozenTime ?: "")
        intent.putExtra("pausedLabel", pausedLabel ?: "Paused")
        intent.putExtra("resumeText", resumeText ?: "Resume")
        reactApplicationContext.startForegroundService(intent)
    }

    @ReactMethod
    fun stopTimer() {
        val intent = Intent(reactApplicationContext, TimerService::class.java)
        reactApplicationContext.stopService(intent)
    }

    @ReactMethod
    fun setMilestoneConfig(configJson: String) {
        val prefs = reactApplicationContext.getSharedPreferences("milestone_config", Context.MODE_PRIVATE)
        prefs.edit().putString("config", configJson).apply()

        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("action", "reload_milestones")
        reactApplicationContext.startService(intent)
    }

    @ReactMethod
    fun clearMilestoneConfig() {
        val prefs = reactApplicationContext.getSharedPreferences("milestone_config", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()

        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("action", "clear_milestones")
        reactApplicationContext.startService(intent)
    }

    @ReactMethod
    fun setAppInForeground(inForeground: Boolean) {
        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("action", "set_foreground")
        intent.putExtra("inForeground", inForeground)
        reactApplicationContext.startService(intent)
    }

    @ReactMethod
    fun getMilestoneThresholds(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("milestone_thresholds", Context.MODE_PRIVATE)
        val json = prefs.getString("thresholds", null)
        promise.resolve(json)
    }

    @ReactMethod
    fun updateCumulativeDistance(meters: Double) {
        val prefs = reactApplicationContext.getSharedPreferences("milestone_distance", Context.MODE_PRIVATE)
        prefs.edit().putFloat("cumulative_meters", meters.toFloat()).apply()
    }
}
