package com.layer100crypto.MyTrack.timer

import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import android.app.PendingIntent
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R


class TimerService : Service() {

    private var handler: Handler? = null
    private var tickRunnable: Runnable? = null
    private var notificationManager: android.app.NotificationManager? = null
    private var notificationBuilder: NotificationCompat.Builder? = null
    private var collapsedViews: RemoteViews? = null
    private var expandedViews: RemoteViews? = null
    private var isPaused = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.getStringExtra("action") ?: "start"

        if (action == "pause") {
            return handlePause(intent)
        }

        Log.d("NativeTimer", "Timer Service started")

        isPaused = false

        val startTime = intent?.getLongExtra("startTime", 0L) ?: 0L
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

        if (mode == "countdown") {
            // Countdown: collapsed = no buttons, expanded = buttons below timer
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
            .setSmallIcon(R.drawable.small_notification_icon)
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

    override fun onDestroy() {
        tickRunnable?.let { handler?.removeCallbacks(it) }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
