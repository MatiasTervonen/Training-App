package com.layer100crypto.MyTrack

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TimerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NativeTimer"

    @ReactMethod
    fun startTimer(startTime: Double, label: String?) {
        val safeLabel = label ?: "Session"

        val intent = Intent(reactApplicationContext, TimerService::class.java)
        intent.putExtra("startTime", startTime.toLong())
        intent.putExtra("label", safeLabel)
        reactApplicationContext.startForegroundService(intent)
    }

    @ReactMethod
    fun stopTimer() {
        val intent = Intent(reactApplicationContext, TimerService::class.java)
        reactApplicationContext.stopService(intent)
    }
}