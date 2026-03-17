package com.layer100crypto.MyTrack.step

import com.layer100crypto.MyTrack.R
import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.layer100crypto.MyTrack.MainActivity
import java.text.NumberFormat
import java.util.Locale

class StepTrackingService : Service(), SensorEventListener {

    companion object {
        private const val TAG = "StepTrackingService"
        private const val CHANNEL_ID = "step_tracking_channel"
        private const val NOTIFICATION_ID = 2001
        private const val NOTIFICATION_UPDATE_INTERVAL_MS = 60_000L // 60 seconds

        fun isRunning(context: Context): Boolean {
            val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            @Suppress("DEPRECATION")
            for (service in manager.getRunningServices(Int.MAX_VALUE)) {
                if (StepTrackingService::class.java.name == service.service.className) {
                    return true
                }
            }
            return false
        }
    }

    private var sensorManager: SensorManager? = null
    private var helper: StepCounterHelper? = null
    private var screenUnlockReceiver: BroadcastReceiver? = null
    private var isSetUp = false
    private var receivedSensorEvent = false

    // Step goal tracking
    private data class StepGoal(val id: String, val target: Int)
    private var cachedGoals: List<StepGoal> = emptyList()
    private var goalsLoadedForDate: String = ""
    private val notificationHandler = Handler(Looper.getMainLooper())
    private val notificationUpdateRunnable = object : Runnable {
        override fun run() {
            updateNotification()
            notificationHandler.postDelayed(this, NOTIFICATION_UPDATE_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        helper = StepCounterHelper(applicationContext)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "RELOAD_GOALS") {
            reloadGoals()
            return START_STICKY
        }

        if (intent?.action == "ENSURE_SENSOR") {
            ensureSensorRegistered()
            return START_STICKY
        }

        Log.d(TAG, "Service starting")

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        if (!isSetUp) {
            registerSensorListener()
            registerScreenUnlockReceiver()
            notificationHandler.postDelayed(notificationUpdateRunnable, NOTIFICATION_UPDATE_INTERVAL_MS)
            isSetUp = true
        }

        return START_STICKY
    }

    override fun onDestroy() {
        Log.d(TAG, "Service destroyed")
        notificationHandler.removeCallbacks(notificationUpdateRunnable)
        sensorManager?.unregisterListener(this)
        sensorManager = null
        screenUnlockReceiver?.let { unregisterReceiver(it) }
        screenUnlockReceiver = null
        helper = null
        isSetUp = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // SensorEventListener — always record hardware step sensor values.
    // TYPE_STEP_COUNTER is hardware-backed and already filters for real steps.
    override fun onSensorChanged(event: SensorEvent) {
        receivedSensorEvent = true
        val currentValue = event.values[0].toLong()
        val h = helper ?: return
        h.recordReadingWithValue(currentValue)

        // Check step goals after recording
        checkStepGoals(h.getTodaySteps())
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun registerSensorListener() {
        val sm = getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        val stepSensor = sm?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

        if (stepSensor == null) {
            Log.e(TAG, "No step counter sensor available")
            stopSelf()
            return
        }

        val registered = sm.registerListener(
            this,
            stepSensor,
            SensorManager.SENSOR_DELAY_NORMAL,
            0 // No batching — deliver events immediately
        )
        sensorManager = sm
        Log.d(TAG, "Sensor listener registered, success=$registered")
    }

    private fun registerScreenUnlockReceiver() {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.action == Intent.ACTION_USER_PRESENT) {
                    Log.d(TAG, "Screen unlocked, triggering widget update")
                    StepWidgetUpdateReceiver.triggerWidgetUpdate(context)
                }
            }
        }
        val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
        registerReceiver(receiver, filter)
        screenUnlockReceiver = receiver
        Log.d(TAG, "Screen unlock receiver registered")
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.step_channel_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = getString(R.string.step_channel_description)
            setShowBadge(false)
        }

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val steps = helper?.getTodaySteps() ?: 0L
        val formattedSteps = NumberFormat.getNumberInstance(Locale.getDefault()).format(steps)

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.step_notification_text, formattedSteps))
            .setSmallIcon(R.drawable.ic_stat_kurvi_icon_ice_blue_transparent)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, buildNotification())

        // Self-healing: if no sensor events have ever been received,
        // the listener may have been registered without ACTIVITY_RECOGNITION permission.
        // Re-register once the permission is granted.
        if (!receivedSensorEvent) {
            ensureSensorRegistered()
        }
    }

    /**
     * Re-registers the step sensor listener if the ACTIVITY_RECOGNITION permission
     * is now granted but no sensor events have been received yet.
     * This handles the case where the service started before the permission was granted
     * (e.g. after clearing app data).
     */
    private fun ensureSensorRegistered() {
        if (receivedSensorEvent) return

        // Check ACTIVITY_RECOGNITION permission on Android 10+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACTIVITY_RECOGNITION
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                Log.d(TAG, "ACTIVITY_RECOGNITION not granted, skipping sensor re-registration")
                return
            }
        }

        val sm = getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return
        val stepSensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return

        // Unregister old listener if any
        sensorManager?.unregisterListener(this)

        // Re-register
        val registered = sm.registerListener(
            this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL, 0
        )
        sensorManager = sm
        Log.d(TAG, "Sensor listener re-registered, success=$registered")
    }

    // --- Step Goal Checking ---

    private fun reloadGoals() {
        val goalPrefs = getSharedPreferences("step_goals_prefs", Context.MODE_PRIVATE)
        val goalsJson = goalPrefs.getString("step_goals", "[]") ?: "[]"
        val arr = org.json.JSONArray(goalsJson)
        cachedGoals = (0 until arr.length()).map { i ->
            val obj = arr.getJSONObject(i)
            StepGoal(obj.getString("id"), obj.getInt("target"))
        }
    }

    private fun checkStepGoals(todaySteps: Long) {
        // Reload goals once per day (picks up changes + resets notified flags)
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        if (goalsLoadedForDate != today) {
            reloadGoals()
            goalsLoadedForDate = today
        }

        if (cachedGoals.isEmpty()) return

        val notifiedPrefs = getSharedPreferences("step_goals_notified", Context.MODE_PRIVATE)
        val notifiedDate = notifiedPrefs.getString("notified_date", "")

        // Reset notified flags if it's a new day
        if (notifiedDate != today) {
            notifiedPrefs.edit()
                .putString("notified_date", today)
                .putStringSet("notified_goals", emptySet())
                .apply()
        }

        val notifiedGoals = notifiedPrefs.getStringSet("notified_goals", emptySet())!!.toMutableSet()

        for (goal in cachedGoals) {
            val key = goal.id
            if (todaySteps >= goal.target && key !in notifiedGoals) {
                notifiedGoals.add(key)
                fireGoalReachedNotification(goal.target)
                triggerStepGoalTask(goal.id, today)
            }
        }

        notifiedPrefs.edit()
            .putStringSet("notified_goals", notifiedGoals)
            .apply()
    }

    private fun fireGoalReachedNotification(target: Int) {
        val channelId = "step_goal_channel"
        val notificationManager = getSystemService(NotificationManager::class.java)

        // Create channel if needed (idempotent)
        val channel = NotificationChannel(
            channelId,
            "Step Goals",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notifications when you reach your step goal"
        }
        notificationManager.createNotificationChannel(channel)

        val formattedTarget = NumberFormat.getNumberInstance(Locale.getDefault()).format(target)

        // Read translated strings from SharedPreferences (written by JS)
        val goalPrefs = getSharedPreferences("step_goals_prefs", Context.MODE_PRIVATE)
        val title = goalPrefs.getString("notif_title", "Step goal reached!") ?: "Step goal reached!"
        val bodyTemplate = goalPrefs.getString("notif_body", "You hit {{steps}} steps today!") ?: "You hit {{steps}} steps today!"
        val body = bodyTemplate.replace("{{steps}}", formattedTarget)

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, target, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = Notification.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_stat_kurvi_icon_ice_blue_transparent)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        // Use target as notification ID so each goal gets its own notification
        notificationManager.notify(target, notification)
    }

    private fun triggerStepGoalTask(habitId: String, date: String) {
        try {
            val taskIntent = Intent(applicationContext, StepGoalTaskService::class.java)
            val bundle = Bundle()
            bundle.putString("habitId", habitId)
            bundle.putString("date", date)
            taskIntent.putExtras(bundle)
            applicationContext.startService(taskIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start StepGoalTaskService", e)
        }
    }
}
