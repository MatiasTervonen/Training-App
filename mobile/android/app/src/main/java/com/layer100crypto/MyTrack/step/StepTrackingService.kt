package com.layer100crypto.MyTrack.step

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
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityRecognitionClient
import com.google.android.gms.location.DetectedActivity
import com.layer100crypto.MyTrack.MainActivity
import java.text.NumberFormat
import java.util.Locale

class StepTrackingService : Service(), SensorEventListener {

    companion object {
        private const val TAG = "StepTrackingService"
        private const val CHANNEL_ID = "step_tracking_channel"
        private const val NOTIFICATION_ID = 2001
        private const val NOTIFICATION_UPDATE_INTERVAL_MS = 60_000L // 60 seconds
        private const val ACTIVITY_DETECTION_INTERVAL_MS = 3_000L // 3 seconds
        private const val WALKING_GRACE_PERIOD_MS = 5_000L // 5 seconds after last walking detection

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
    private var activityRecognitionClient: ActivityRecognitionClient? = null
    private var activityRecognitionPendingIntent: PendingIntent? = null
    private var isSetUp = false
    private var isActivityRecognitionActive = false
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
        Log.d(TAG, "Service starting")

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        if (!isSetUp) {
            registerSensorListener()
            registerScreenUnlockReceiver()
            notificationHandler.postDelayed(notificationUpdateRunnable, NOTIFICATION_UPDATE_INTERVAL_MS)
            isSetUp = true
        }

        if (!isActivityRecognitionActive) {
            startActivityRecognition()
        }

        return START_STICKY
    }

    override fun onDestroy() {
        Log.d(TAG, "Service destroyed")
        notificationHandler.removeCallbacks(notificationUpdateRunnable)
        stopActivityRecognition()
        sensorManager?.unregisterListener(this)
        sensorManager = null
        screenUnlockReceiver?.let { unregisterReceiver(it) }
        screenUnlockReceiver = null
        helper = null
        isSetUp = false
        isActivityRecognitionActive = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // SensorEventListener
    override fun onSensorChanged(event: SensorEvent) {
        val currentValue = event.values[0].toLong()
        val h = helper ?: return

        if (shouldCountStep()) {
            h.recordReadingWithValue(currentValue)
        } else {
            // Update baseline to prevent filtered steps from flooding back later
            h.updateLastSensorValue(currentValue)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun shouldCountStep(): Boolean {
        val prefs = getSharedPreferences("step_counter_prefs", Context.MODE_PRIVATE)
        val activityType = prefs.getInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_TYPE, DetectedActivity.UNKNOWN)
        val activityConfidence = prefs.getInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_CONFIDENCE, 0)
        val lastWalkingTime = prefs.getLong(StepCounterHelper.KEY_LAST_WALKING_TIMESTAMP, 0L)

        // Accept steps if Activity Recognition hasn't reported yet (fail-open)
        if (activityType == DetectedActivity.UNKNOWN) return true

        // Accept steps if user is walking/running with sufficient confidence
        val isMoving = activityType in listOf(
            DetectedActivity.WALKING,
            DetectedActivity.RUNNING,
            DetectedActivity.ON_FOOT
        ) && activityConfidence >= 70

        if (isMoving) return true

        // Grace period: accept steps for 5 seconds after last walking detection
        val gracePeriodActive = System.currentTimeMillis() - lastWalkingTime < WALKING_GRACE_PERIOD_MS
        if (gracePeriodActive) return true

        return false
    }

    @android.annotation.SuppressLint("MissingPermission")
    private fun startActivityRecognition() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACTIVITY_RECOGNITION
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        val client = ActivityRecognition.getClient(this)
        val intent = Intent(this, ActivityRecognitionReceiver::class.java)
        val pi = PendingIntent.getBroadcast(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        client.requestActivityUpdates(ACTIVITY_DETECTION_INTERVAL_MS, pi)
            .addOnSuccessListener {
                Log.d(TAG, "Activity Recognition started (interval: ${ACTIVITY_DETECTION_INTERVAL_MS}ms)")
                isActivityRecognitionActive = true
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to start Activity Recognition: ${e.message}")
                isActivityRecognitionActive = false
            }

        activityRecognitionClient = client
        activityRecognitionPendingIntent = pi
    }

    private fun stopActivityRecognition() {
        val pi = activityRecognitionPendingIntent ?: return
        activityRecognitionClient?.removeActivityUpdates(pi)
            ?.addOnSuccessListener {
                Log.d(TAG, "Activity Recognition stopped")
            }
        activityRecognitionClient = null
        activityRecognitionPendingIntent = null
    }

    private fun registerSensorListener() {
        val sm = getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        val stepSensor = sm?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

        if (stepSensor == null) {
            Log.e(TAG, "No step counter sensor available")
            stopSelf()
            return
        }

        sm.registerListener(
            this,
            stepSensor,
            SensorManager.SENSOR_DELAY_NORMAL,
            0 // No batching — deliver events immediately
        )
        sensorManager = sm
        Log.d(TAG, "Sensor listener registered")
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
            "Step Tracking",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows step tracking progress"
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
            .setContentTitle("MyTrack")
            .setContentText("Tracking steps: $formattedSteps today")
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
    }
}
