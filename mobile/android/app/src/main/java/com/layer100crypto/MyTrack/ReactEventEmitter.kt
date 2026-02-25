package com.layer100crypto.MyTrack

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

object ReactEventEmitter {

    fun sendTimerFinished(
        context: Context,
        reminderId: String?,
        title: String
    ): Boolean {

        val reactApplication = context.applicationContext as? ReactApplication
            ?: return false

        // Try New Architecture first (reactHost)
        var reactContext: ReactContext? = try {
            reactApplication.reactHost?.currentReactContext
        } catch (e: Exception) {
            null
        }

        // Fall back to old architecture (reactNativeHost -> reactInstanceManager)
        if (reactContext == null) {
            reactContext = try {
                reactApplication.reactNativeHost
                    ?.reactInstanceManager
                    ?.currentReactContext
            } catch (e: Exception) {
                null
            }
        }

        if (reactContext == null) return false

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("TIMER_FINISHED", Arguments.createMap().apply {
                putString("id", reminderId)
                putString("title", title)
            })

        return true
    }
    
    fun sendStopAlarmSound(context: Context): Boolean {
        val reactApplication = context.applicationContext as? ReactApplication
            ?: return false

        var reactContext: ReactContext? = try {
            reactApplication.reactHost?.currentReactContext
        } catch (e: Exception) {
            null
        }

        if (reactContext == null) {
            reactContext = try {
                reactApplication.reactNativeHost
                    ?.reactInstanceManager
                    ?.currentReactContext
            } catch (e: Exception) {
                null
            }
        }

        if (reactContext == null) return false

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("STOP_ALARM_SOUND", null)

        return true
    }

    fun sendTimerSnoozed(
        context: Context,
        endTimestamp: Long,
        durationSeconds: Int,
        title: String
    ): Boolean {
        val reactApplication = context.applicationContext as? ReactApplication
            ?: return false

        var reactContext: ReactContext? = try {
            reactApplication.reactHost?.currentReactContext
        } catch (e: Exception) {
            null
        }

        if (reactContext == null) {
            reactContext = try {
                reactApplication.reactNativeHost
                    ?.reactInstanceManager
                    ?.currentReactContext
            } catch (e: Exception) {
                null
            }
        }

        if (reactContext == null) return false

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("TIMER_SNOOZED", Arguments.createMap().apply {
                putDouble("endTimestamp", endTimestamp.toDouble())
                putInt("durationSeconds", durationSeconds)
                putString("title", title)
            })

        return true
    }

    fun sendGlobalReminderSnoozed(
        context: Context,
        reminderId: String,
        snoozeDurationMinutes: Int
    ): Boolean {
        val reactApplication = context.applicationContext as? ReactApplication
            ?: return false

        var reactContext: ReactContext? = try {
            reactApplication.reactHost?.currentReactContext
        } catch (e: Exception) {
            null
        }

        if (reactContext == null) {
            reactContext = try {
                reactApplication.reactNativeHost
                    ?.reactInstanceManager
                    ?.currentReactContext
            } catch (e: Exception) {
                null
            }
        }

        if (reactContext == null) return false

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("GLOBAL_REMINDER_SNOOZED", Arguments.createMap().apply {
                putString("reminderId", reminderId)
                putInt("snoozeDurationMinutes", snoozeDurationMinutes)
            })

        return true
    }

    fun sendAlarmPlaying(
        context: Context,
        reminderId: String,
        soundType: String,
        title: String,
        content: String
    ): Boolean {
        val reactApplication = context.applicationContext as? ReactApplication
            ?: return false

        var reactContext: ReactContext? = try {
            reactApplication.reactHost?.currentReactContext
        } catch (e: Exception) {
            null
        }

        if (reactContext == null) {
            reactContext = try {
                reactApplication.reactNativeHost
                    ?.reactInstanceManager
                    ?.currentReactContext
            } catch (e: Exception) {
                null
            }
        }

        if (reactContext == null) return false

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("ALARM_PLAYING", Arguments.createMap().apply {
                putString("reminderId", reminderId)
                putString("soundType", soundType)
                putString("title", title)
                putString("content", content)
            })

        return true
    }
}
