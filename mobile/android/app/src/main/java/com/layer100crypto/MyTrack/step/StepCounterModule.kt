package com.layer100crypto.MyTrack.step

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.module.annotations.ReactModule
import com.google.android.gms.location.DetectedActivity

@ReactModule(name = "NativeStepCounter")
class StepCounterModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PERMISSION_REQUEST_CODE = 9001
        private const val PREFS_NAME = "step_permission_prefs"
        private const val KEY_HAS_ASKED = "has_asked_step_permission"
        private const val STEP_PREFS_NAME = "step_counter_prefs"
        private const val KEY_SESSION_START_VALUE = "session_start_value"
        private const val EVENT_LIVE_STEPS = "LIVE_STEP_UPDATE"
    }

    private var permissionPromise: Promise? = null
    private var sensorManager: SensorManager? = null
    private var liveListener: SensorEventListener? = null

    override fun getName() = "NativeStepCounter"

    // --- Foreground Service Control ---

    @ReactMethod
    fun startStepTrackingService() {
        val intent = Intent(reactContext, StepTrackingService::class.java)
        ContextCompat.startForegroundService(reactContext, intent)
    }

    @ReactMethod
    fun stopStepTrackingService() {
        val intent = Intent(reactContext, StepTrackingService::class.java)
        reactContext.stopService(intent)
    }

    @ReactMethod
    fun isStepTrackingServiceRunning(promise: Promise) {
        promise.resolve(StepTrackingService.isRunning(reactContext))
    }

    // --- Permissions ---

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

    // --- Step Data ---

    @ReactMethod
    fun hasSensor(promise: Promise) {
        val helper = StepCounterHelper(reactContext)
        promise.resolve(helper.hasSensor())
    }

    @ReactMethod
    fun getTodaySteps(promise: Promise) {
        try {
            val helper = StepCounterHelper(reactContext)
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

    // --- Session Tracking ---

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

    // --- Live Step Updates (for activity sessions) ---

    @ReactMethod
    fun startLiveStepUpdates() {
        // Stop any existing listener first
        stopLiveListenerInternal()

        val sm = reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return
        val stepSensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return

        val prefs = reactContext.getSharedPreferences(STEP_PREFS_NAME, Context.MODE_PRIVATE)
        val sessionStart = prefs.getLong(KEY_SESSION_START_VALUE, -1L)
        val helper = StepCounterHelper(reactContext)

        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                val currentValue = event.values[0].toLong()
                if (sessionStart == -1L) return

                // Calculate delta from last live sensor reading
                val lastLive = helper.getSessionLastLiveSensor()
                val delta = when {
                    lastLive == -1L -> 0L
                    currentValue < lastLive -> currentValue // reboot
                    else -> currentValue - lastLive
                }
                helper.setSessionLastLiveSensor(currentValue)

                // Check Activity Recognition filter
                if (delta > 0 && !shouldCountLiveStep(prefs)) {
                    helper.addSessionFilteredSteps(delta)
                    return
                }

                // Calculate filtered session steps
                val rawSteps = if (currentValue < sessionStart) {
                    currentValue
                } else {
                    currentValue - sessionStart
                }
                val filteredSteps = helper.getSessionFilteredSteps()
                val displaySteps = maxOf(rawSteps - filteredSteps, 0L).toInt()

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(EVENT_LIVE_STEPS, displaySteps)
            }

            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }

        sm.registerListener(listener, stepSensor, SensorManager.SENSOR_DELAY_NORMAL, 0)
        sensorManager = sm
        liveListener = listener
    }

    private fun shouldCountLiveStep(prefs: android.content.SharedPreferences): Boolean {
        val activityType = prefs.getInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_TYPE, DetectedActivity.UNKNOWN)
        val activityConfidence = prefs.getInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_CONFIDENCE, 0)
        val lastWalkingTime = prefs.getLong(StepCounterHelper.KEY_LAST_WALKING_TIMESTAMP, 0L)

        // Accept if Activity Recognition hasn't reported yet
        if (activityType == DetectedActivity.UNKNOWN) return true

        // Accept if user is walking/running
        val isMoving = activityType in listOf(
            DetectedActivity.WALKING,
            DetectedActivity.RUNNING,
            DetectedActivity.ON_FOOT
        ) && activityConfidence >= 70
        if (isMoving) return true

        // Grace period: 5 seconds after last walking detection
        if (System.currentTimeMillis() - lastWalkingTime < 5_000L) return true

        return false
    }

    @ReactMethod
    fun stopLiveStepUpdates() {
        stopLiveListenerInternal()
    }

    private fun stopLiveListenerInternal() {
        liveListener?.let { listener ->
            sensorManager?.unregisterListener(listener)
        }
        liveListener = null
        sensorManager = null
    }
}
