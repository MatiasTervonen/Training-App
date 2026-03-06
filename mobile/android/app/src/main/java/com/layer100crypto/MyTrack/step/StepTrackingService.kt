package com.layer100crypto.MyTrack.step

import com.layer100crypto.MyTrack.R
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
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
        val currentValue = event.values[0].toLong()
        val h = helper ?: return
        h.recordReadingWithValue(currentValue)
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
            .setContentTitle(getString(R.string.app_name))
            .setContentText("Tracking steps: $formattedSteps today")
            .setSmallIcon(R.drawable.small_notification_icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
    }
}
