package com.layer100crypto.MyTrack.timer

import android.content.Intent
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
}
