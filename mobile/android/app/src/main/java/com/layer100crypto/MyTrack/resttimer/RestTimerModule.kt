package com.layer100crypto.MyTrack.resttimer

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RestTimerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NativeRestTimer"

    @ReactMethod
    fun startRestTimer(endTime: Double, label: String?, statusText: String?, cancelText: String?) {
        val intent = Intent(reactApplicationContext, RestTimerService::class.java)
        intent.putExtra("endTime", endTime.toLong())
        intent.putExtra("label", label ?: "Rest")
        intent.putExtra("statusText", statusText ?: "Resting")
        intent.putExtra("cancelText", cancelText ?: "Skip")
        reactApplicationContext.startForegroundService(intent)
    }

    @ReactMethod
    fun stopRestTimer() {
        val intent = Intent(reactApplicationContext, RestTimerService::class.java)
        reactApplicationContext.stopService(intent)
    }
}
