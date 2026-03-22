package com.layer100crypto.MyTrack.timer

import android.app.NotificationChannel
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import android.app.PendingIntent
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R
import org.json.JSONObject


data class MilestoneMetricConfig(val enabled: Boolean, val interval: Double)
data class MilestoneConfig(
    val steps: MilestoneMetricConfig,
    val duration: MilestoneMetricConfig,
    val distance: MilestoneMetricConfig,
    val calories: MilestoneMetricConfig,
    val baseMet: Double,
    val userWeight: Double,
)
data class MilestoneThresholds(
    var steps: Long? = null,
    var durationSecs: Long? = null,
    var distanceMeters: Double? = null,
    var calories: Double? = null,
)

class TimerService : Service() {

    private var handler: Handler? = null
    private var tickRunnable: Runnable? = null
    private var notificationManager: android.app.NotificationManager? = null
    private var notificationBuilder: NotificationCompat.Builder? = null
    private var collapsedViews: RemoteViews? = null
    private var expandedViews: RemoteViews? = null
    private var isPaused = false

    // Milestone alert fields
    private var appInForeground = true
    private var milestoneConfig: MilestoneConfig? = null
    private var nextThresholds = MilestoneThresholds()
    private var stepSensorManager: SensorManager? = null
    private var milestoneStepListener: SensorEventListener? = null
    private var sessionBaselineSteps: Long = -1L
    private var currentSessionSteps: Long = 0L
    private var timerStartTime: Long = 0L
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.getStringExtra("action") ?: "start"

        if (action == "pause") {
            return handlePause(intent)
        }
        if (action == "reload_milestones") {
            loadMilestoneConfig()
            return START_STICKY
        }
        if (action == "clear_milestones") {
            milestoneConfig = null
            nextThresholds = MilestoneThresholds()
            unregisterMilestoneStepListener()
            releaseWakeLock()
            return START_STICKY
        }
        if (action == "set_foreground") {
            appInForeground = intent?.getBooleanExtra("inForeground", true) ?: true
            return START_STICKY
        }

        Log.d("NativeTimer", "Timer Service started")

        isPaused = false

        val startTime = intent?.getLongExtra("startTime", 0L) ?: 0L
        timerStartTime = startTime
        val label = intent?.getStringExtra("label") ?: "Session"
        val mode = intent?.getStringExtra("mode") ?: "countup"
        val pauseText = intent?.getStringExtra("pauseText") ?: "Pause"
        val extendText = intent?.getStringExtra("extendText") ?: "+1 min"

        notificationManager = getSystemService(android.app.NotificationManager::class.java)

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            this.flags =
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_NEW_TASK

            putExtra("openSession", true)
            putExtra("sessionLabel", label)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Pause button
        val pauseIntent = Intent(this, PauseTimerReceiver::class.java)
        val pausePendingIntent = PendingIntent.getBroadcast(
            this, 10, pauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Extend button (countdown only)
        val extendIntent = Intent(this, ExtendTimerReceiver::class.java)
        val extendPendingIntent = PendingIntent.getBroadcast(
            this, 11, extendIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val timeText = if (mode == "countdown") {
            formatTime(startTime - System.currentTimeMillis())
        } else {
            formatTime(System.currentTimeMillis() - startTime)
        }

        if (mode == "countdown" && !extendText.isNullOrEmpty()) {
            // Countdown with extend: collapsed = no buttons, expanded = buttons below timer
            collapsedViews = RemoteViews(packageName, R.layout.notification_timer_collapsed).apply {
                setTextViewText(R.id.timer_label, label)
                setTextViewText(R.id.timer_text, timeText)
            }
            expandedViews = RemoteViews(packageName, R.layout.notification_rest_timer).apply {
                setTextViewText(R.id.timer_label, label)
                setTextViewText(R.id.timer_text, timeText)
                setTextViewText(R.id.btn_primary, pauseText)
                setViewVisibility(R.id.btn_primary, View.VISIBLE)
                setOnClickPendingIntent(R.id.btn_primary, pausePendingIntent)
                setTextViewText(R.id.btn_secondary, extendText)
                setViewVisibility(R.id.btn_secondary, View.VISIBLE)
                setOnClickPendingIntent(R.id.btn_secondary, extendPendingIntent)
            }
        } else if (mode == "countdown") {
            // Countdown without extend (e.g. habit timer): pause button inline with time
            val inlineViews = RemoteViews(packageName, R.layout.notification_timer_expanded_inline).apply {
                setTextViewText(R.id.timer_label, label)
                setTextViewText(R.id.timer_text, timeText)
                setTextViewText(R.id.btn_primary, pauseText)
                setViewVisibility(R.id.btn_primary, View.VISIBLE)
                setOnClickPendingIntent(R.id.btn_primary, pausePendingIntent)
            }
            collapsedViews = inlineViews
            expandedViews = inlineViews
        } else {
            // Stopwatch: single button inline — same layout for collapsed and expanded
            val inlineViews = RemoteViews(packageName, R.layout.notification_timer_expanded_inline).apply {
                setTextViewText(R.id.timer_label, label)
                setTextViewText(R.id.timer_text, timeText)
                setTextViewText(R.id.btn_primary, pauseText)
                setViewVisibility(R.id.btn_primary, View.VISIBLE)
                setOnClickPendingIntent(R.id.btn_primary, pausePendingIntent)
            }
            collapsedViews = inlineViews
            expandedViews = inlineViews
        }

        notificationBuilder = NotificationCompat.Builder(this, "timer_channel")
            .setSmallIcon(R.drawable.ic_stat_kurvi_icon_ice_blue_transparent)
            .setOngoing(true)
            .setShowWhen(false)
            .setColorized(true)
            .setColor(Color.parseColor("#0f172a"))
            .setCustomContentView(collapsedViews)
            .setCustomBigContentView(expandedViews)
            .setContentIntent(pendingIntent)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        startForeground(1, notificationBuilder!!.build())

        // Stop any previous ticker
        tickRunnable?.let { handler?.removeCallbacks(it) }

        handler = Handler(Looper.getMainLooper())
        tickRunnable = object : Runnable {
            override fun run() {
                if (isPaused) return

                val now = System.currentTimeMillis()
                val millis = if (mode == "countdown") {
                    startTime - now
                } else {
                    now - startTime
                }

                if (mode == "countdown" && millis <= 0) {
                    val zero = formatTime(0)
                    collapsedViews?.setTextViewText(R.id.timer_text, zero)
                    expandedViews?.setTextViewText(R.id.timer_text, zero)
                    notificationManager?.notify(1, notificationBuilder!!.build())
                    stopSelf()
                    return
                }

                val formatted = formatTime(millis)
                collapsedViews?.setTextViewText(R.id.timer_text, formatted)
                expandedViews?.setTextViewText(R.id.timer_text, formatted)
                notificationManager?.notify(1, notificationBuilder!!.build())

                // Check milestones on each tick
                if (mode != "countdown") {
                    checkMilestones(millis / 1000)
                }

                handler?.postDelayed(this, 1000)
            }
        }
        handler?.postDelayed(tickRunnable!!, 1000)

        return START_STICKY
    }

    private fun handlePause(intent: Intent?): Int {
        Log.d("NativeTimer", "Timer Service paused")
        isPaused = true

        // Stop the ticker
        tickRunnable?.let { handler?.removeCallbacks(it) }

        val frozenTime = intent?.getStringExtra("frozenTime") ?: ""
        val pausedLabel = intent?.getStringExtra("pausedLabel") ?: "Paused"
        val resumeText = intent?.getStringExtra("resumeText") ?: "Resume"

        // Resume button
        val resumeIntent = Intent(this, ResumeTimerReceiver::class.java)
        val resumePendingIntent = PendingIntent.getBroadcast(
            this, 12, resumeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Rebuild as inline layout with resume button for both collapsed and expanded
        val inlineViews = RemoteViews(packageName, R.layout.notification_timer_expanded_inline).apply {
            setTextViewText(R.id.timer_label, pausedLabel)
            setTextViewText(R.id.timer_text, frozenTime)
            setTextViewText(R.id.btn_primary, resumeText)
            setViewVisibility(R.id.btn_primary, View.VISIBLE)
            setOnClickPendingIntent(R.id.btn_primary, resumePendingIntent)
        }
        collapsedViews = inlineViews
        expandedViews = inlineViews

        // Rebuild notification with new views
        notificationBuilder?.setCustomContentView(collapsedViews)
        notificationBuilder?.setCustomBigContentView(expandedViews)
        notificationManager?.notify(1, notificationBuilder!!.build())

        return START_STICKY
    }

    private fun formatTime(millis: Long): String {
        val totalSeconds = (millis / 1000).coerceAtLeast(0)
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60

        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%d:%02d", minutes, seconds)
        }
    }

    private fun loadMilestoneConfig() {
        try {
            val prefs = getSharedPreferences("milestone_config", Context.MODE_PRIVATE)
            val configJson = prefs.getString("config", null) ?: return
            val json = JSONObject(configJson)

            val steps = json.getJSONObject("steps")
            val duration = json.getJSONObject("duration")
            val distance = json.getJSONObject("distance")
            val calories = json.getJSONObject("calories")

            milestoneConfig = MilestoneConfig(
                steps = MilestoneMetricConfig(steps.getBoolean("enabled"), steps.getDouble("interval")),
                duration = MilestoneMetricConfig(duration.getBoolean("enabled"), duration.getDouble("interval")),
                distance = MilestoneMetricConfig(distance.getBoolean("enabled"), distance.getDouble("interval")),
                calories = MilestoneMetricConfig(calories.getBoolean("enabled"), calories.getDouble("interval")),
                baseMet = json.getDouble("baseMet"),
                userWeight = json.getDouble("userWeight"),
            )

            val config = milestoneConfig!!

            // Initialize thresholds
            nextThresholds = MilestoneThresholds(
                steps = if (config.steps.enabled) config.steps.interval.toLong() else null,
                durationSecs = if (config.duration.enabled) (config.duration.interval * 60).toLong() else null,
                distanceMeters = if (config.distance.enabled) config.distance.interval * 1000.0 else null,
                calories = if (config.calories.enabled) config.calories.interval else null,
            )

            persistThresholds()

            // Register step sensor if steps milestone enabled
            if (config.steps.enabled) {
                registerMilestoneStepListener()
            }

            // Keep CPU awake so Handler ticks continue when screen is off
            acquireWakeLock()

            Log.d("NativeTimer", "Milestone config loaded: steps=${config.steps.enabled}, duration=${config.duration.enabled}, distance=${config.distance.enabled}, calories=${config.calories.enabled}")
        } catch (e: Exception) {
            Log.e("NativeTimer", "Failed to load milestone config", e)
        }
    }

    private fun registerMilestoneStepListener() {
        val sm = getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return
        val sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return

        // Read session baseline (set by JS when session started)
        val prefs = getSharedPreferences("step_counter_prefs", Context.MODE_PRIVATE)
        sessionBaselineSteps = prefs.getLong("session_start_value", -1L)

        milestoneStepListener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                val currentValue = event.values[0].toLong()
                currentSessionSteps = if (sessionBaselineSteps == -1L) 0
                    else maxOf(currentValue - sessionBaselineSteps, 0)
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }

        sm.registerListener(milestoneStepListener, sensor, SensorManager.SENSOR_DELAY_NORMAL)
        stepSensorManager = sm
    }

    private fun unregisterMilestoneStepListener() {
        milestoneStepListener?.let { listener ->
            stepSensorManager?.unregisterListener(listener)
        }
        milestoneStepListener = null
        stepSensorManager = null
        sessionBaselineSteps = -1L
        currentSessionSteps = 0L
    }

    private fun checkMilestones(elapsedSeconds: Long) {
        // Always track thresholds (even in foreground) so native stays in sync with JS.
        // Only fire notifications when app is backgrounded.
        if (isPaused || milestoneConfig == null) return

        val config = milestoneConfig!!
        val t = nextThresholds
        val hitLines = mutableListOf<String>()

        // Duration
        if (t.durationSecs != null && elapsedSeconds >= t.durationSecs!!) {
            val mins = t.durationSecs!! / 60
            hitLines.add("$mins min!")
            t.durationSecs = t.durationSecs!! + (config.duration.interval * 60).toLong()
        }

        // Steps (from sensor listener)
        if (t.steps != null && currentSessionSteps >= t.steps!!) {
            hitLines.add("${t.steps} steps!")
            t.steps = t.steps!! + config.steps.interval.toLong()
        }

        // Calories (baseMet × weight × hours)
        if (t.calories != null) {
            val currentCalories = config.baseMet * config.userWeight * (elapsedSeconds.toDouble() / 3600.0)
            if (currentCalories >= t.calories!!) {
                hitLines.add("${t.calories!!.toInt()} cal!")
                t.calories = t.calories!! + config.calories.interval
            }
        }

        // Distance (read from SharedPreferences, updated by JS background location task)
        if (t.distanceMeters != null) {
            val distPrefs = getSharedPreferences("milestone_distance", Context.MODE_PRIVATE)
            val currentDistance = distPrefs.getFloat("cumulative_meters", 0f).toDouble()
            if (currentDistance >= t.distanceMeters!!) {
                val km = t.distanceMeters!! / 1000.0
                hitLines.add("$km km!")
                t.distanceMeters = t.distanceMeters!! + config.distance.interval * 1000.0
            }
        }

        if (hitLines.isNotEmpty()) {
            persistThresholds()
            // Only fire notification when app is in background
            if (!appInForeground) {
                fireMilestoneNotification(hitLines)
            }
        }
    }

    private fun persistThresholds() {
        try {
            val json = JSONObject()
            json.put("steps", nextThresholds.steps ?: JSONObject.NULL)
            json.put("durationSecs", nextThresholds.durationSecs ?: JSONObject.NULL)
            json.put("distanceMeters", nextThresholds.distanceMeters ?: JSONObject.NULL)
            json.put("calories", nextThresholds.calories ?: JSONObject.NULL)

            val prefs = getSharedPreferences("milestone_thresholds", Context.MODE_PRIVATE)
            prefs.edit().putString("thresholds", json.toString()).apply()
        } catch (e: Exception) {
            Log.e("NativeTimer", "Failed to persist thresholds", e)
        }
    }

    private fun fireMilestoneNotification(lines: List<String>) {
        val nm = notificationManager ?: getSystemService(android.app.NotificationManager::class.java) ?: return

        // Ensure milestone notification channel exists
        val channel = NotificationChannel(
            "milestone_alerts",
            "Activity Milestones",
            android.app.NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 300, 100, 300)
            val soundUri = Uri.parse("android.resource://$packageName/${R.raw.mixkit_alert_bells_echo_765}")
            setSound(soundUri, AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
            lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        }
        nm.createNotificationChannel(channel)

        val bodyText = lines.joinToString(", ")

        val notification = NotificationCompat.Builder(this, "milestone_alerts")
            .setSmallIcon(R.drawable.ic_stat_kurvi_icon_ice_blue_transparent)
            .setContentTitle("Milestone!")
            .setContentText(bodyText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setTimeoutAfter(15000)
            .build()

        nm.notify(3001, notification)
    }

    private fun acquireWakeLock() {
        if (wakeLock != null) return
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MyTrack::MilestoneAlerts")
        wakeLock?.acquire()
        Log.d("NativeTimer", "WakeLock acquired for milestone alerts")
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) it.release()
            Log.d("NativeTimer", "WakeLock released")
        }
        wakeLock = null
    }

    override fun onDestroy() {
        tickRunnable?.let { handler?.removeCallbacks(it) }
        unregisterMilestoneStepListener()
        releaseWakeLock()
        // Clear milestone SharedPreferences
        getSharedPreferences("milestone_config", Context.MODE_PRIVATE).edit().clear().apply()
        getSharedPreferences("milestone_thresholds", Context.MODE_PRIVATE).edit().clear().apply()
        getSharedPreferences("milestone_distance", Context.MODE_PRIVATE).edit().clear().apply()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
