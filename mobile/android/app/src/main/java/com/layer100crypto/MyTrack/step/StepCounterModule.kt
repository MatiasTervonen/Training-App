package com.layer100crypto.MyTrack.step

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.module.annotations.ReactModule

import java.util.concurrent.TimeUnit

@ReactModule(name = "NativeStepCounter")
class StepCounterModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PERMISSION_REQUEST_CODE = 9001
        private const val WORK_NAME = "step_counter_periodic"
        private const val PREFS_NAME = "step_permission_prefs"
        private const val KEY_HAS_ASKED = "has_asked_step_permission"
    }

    private var permissionPromise: Promise? = null

    override fun getName() = "NativeStepCounter"

    @ReactMethod
    fun initializeStepCounter() {
        val request = PeriodicWorkRequestBuilder<StepCounterWorker>(15, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(reactContext)
            .enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(true)
            return
        }
        val granted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED
        promise.resolve(granted)
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(true)
            return
        }

        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }

        if (ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACTIVITY_RECOGNITION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            promise.resolve(true)
            return
        }

        val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val hasAskedBefore = prefs.getBoolean(KEY_HAS_ASKED, false)
        val shouldShowRationale = ActivityCompat.shouldShowRequestPermissionRationale(
            activity,
            Manifest.permission.ACTIVITY_RECOGNITION
        )

        // Permission is permanently denied: rationale is false and we've asked before
        if (!shouldShowRationale && hasAskedBefore) {
            openAppSettings()
            promise.resolve(false)
            return
        }

        // Mark that we've asked at least once
        prefs.edit().putBoolean(KEY_HAS_ASKED, true).apply()

        permissionPromise = promise

        val permissionAwareActivity = activity as PermissionAwareActivity
        permissionAwareActivity.requestPermissions(
            arrayOf(Manifest.permission.ACTIVITY_RECOGNITION),
            PERMISSION_REQUEST_CODE,
            object : PermissionListener {
                override fun onRequestPermissionsResult(
                    requestCode: Int,
                    permissions: Array<String>,
                    grantResults: IntArray
                ): Boolean {
                    if (requestCode == PERMISSION_REQUEST_CODE) {
                        val granted = grantResults.isNotEmpty() &&
                            grantResults[0] == PackageManager.PERMISSION_GRANTED
                        permissionPromise?.resolve(granted)
                        permissionPromise = null
                        return true
                    }
                    return false
                }
            }
        )
    }

    private fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", reactContext.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun isPermissionPermanentlyDenied(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(false)
            return
        }

        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }

        val granted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED

        if (granted) {
            promise.resolve(false)
            return
        }

        val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val hasAskedBefore = prefs.getBoolean(KEY_HAS_ASKED, false)
        val shouldShowRationale = ActivityCompat.shouldShowRequestPermissionRationale(
            activity,
            Manifest.permission.ACTIVITY_RECOGNITION
        )

        promise.resolve(!shouldShowRationale && hasAskedBefore)
    }

    @ReactMethod
    fun hasSensor(promise: Promise) {
        val helper = StepCounterHelper(reactContext)
        promise.resolve(helper.hasSensor())
    }

    @ReactMethod
    fun getTodaySteps(promise: Promise) {
        try {
            val helper = StepCounterHelper(reactContext)
            helper.recordReading()
            promise.resolve(helper.getTodaySteps().toInt())
        } catch (e: Exception) {
            promise.reject("STEP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getStepsForDate(dateString: String, promise: Promise) {
        try {
            val helper = StepCounterHelper(reactContext)
            promise.resolve(helper.getStepsForDate(dateString).toInt())
        } catch (e: Exception) {
            promise.reject("STEP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startSession(promise: Promise) {
        try {
            val helper = StepCounterHelper(reactContext)
            val value = helper.startSession()
            promise.resolve(value != null)
        } catch (e: Exception) {
            promise.reject("STEP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getSessionSteps(promise: Promise) {
        try {
            val helper = StepCounterHelper(reactContext)
            promise.resolve(helper.getSessionSteps().toInt())
        } catch (e: Exception) {
            promise.reject("STEP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getDailyStepsHistory(days: Int, promise: Promise) {
        try {
            val helper = StepCounterHelper(reactContext)
            val history = helper.getDailyStepsHistory(days)
            val map = Arguments.createMap()
            val keys = history.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                map.putInt(key, history.getLong(key).toInt())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STEP_ERROR", e.message, e)
        }
    }
}
