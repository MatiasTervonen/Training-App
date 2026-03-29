package com.layer100crypto.MyTrack.resttimer

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.os.CountDownTimer
import android.util.Log
import android.view.View
import android.graphics.Color
import android.media.AudioAttributes
import android.net.Uri
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import android.app.PendingIntent
import android.app.NotificationChannel
import android.app.NotificationManager
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R

class RestTimerService : Service() {

    private var countDownTimer: CountDownTimer? = null
    private var notificationManager: NotificationManager? = null
    private var notificationBuilder: NotificationCompat.Builder? = null
    private var collapsedViews: RemoteViews? = null
    private var expandedViews: RemoteViews? = null
    private var finishedText: String = "Rest time is up!"

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("RestTimer", "Rest Timer Service started")

        val endTime = intent?.getLongExtra("endTime", 0L) ?: 0L
        val label = intent?.getStringExtra("label") ?: "Rest"
        val cancelText = intent?.getStringExtra("cancelText") ?: "Skip"
        finishedText = intent?.getStringExtra("finishedText") ?: "Rest time is up!"

        // Create notification channel
        val channel = NotificationChannel(
            "rest_timer_channel",
            "Rest Timer",
            NotificationManager.IMPORTANCE_LOW
        )
        notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager?.createNotificationChannel(channel)

        // Open app intent
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            this.flags =
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_NEW_TASK
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            1,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Cancel button intent
        val cancelIntent = Intent(this, StopRestTimerReceiver::class.java)
        val cancelPendingIntent = PendingIntent.getBroadcast(
            this,
            0,
            cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val remaining = endTime - System.currentTimeMillis()

        // Single button — same inline layout for collapsed and expanded
        val inlineViews = RemoteViews(packageName, R.layout.notification_timer_expanded_inline).apply {
            setTextViewText(R.id.timer_label, label)
            setTextViewText(R.id.timer_text, formatTime(remaining))
            setTextViewText(R.id.btn_primary, cancelText)
            setViewVisibility(R.id.btn_primary, View.VISIBLE)
            setOnClickPendingIntent(R.id.btn_primary, cancelPendingIntent)
        }
        collapsedViews = inlineViews
        expandedViews = inlineViews

        notificationBuilder = NotificationCompat.Builder(this, "rest_timer_channel")
            .setSmallIcon(R.drawable.ic_stat_kurvi_icon_ice_blue_transparent)
            .setOngoing(true)
            .setShowWhen(false)
            .setColorized(true)
            .setColor(Color.parseColor("#0f172a"))
            .setCustomContentView(collapsedViews)
            .setCustomBigContentView(expandedViews)
            .setContentIntent(pendingIntent)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        startForeground(3, notificationBuilder!!.build())

        // Update notification every second with remaining time
        countDownTimer?.cancel()
        countDownTimer = object : CountDownTimer(remaining.coerceAtLeast(0), 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val formatted = formatTime(millisUntilFinished)
                collapsedViews?.setTextViewText(R.id.timer_text, formatted)
                expandedViews?.setTextViewText(R.id.timer_text, formatted)
                notificationManager?.notify(3, notificationBuilder!!.build())
            }
            override fun onFinish() {
                showFinishedNotification()
                stopSelf()
            }
        }.start()

        return START_STICKY
    }

    private fun showFinishedNotification() {
        val nm = notificationManager ?: getSystemService(NotificationManager::class.java) ?: return

        // Create a high-importance channel with the rest timer sound
        // Use USAGE_ALARM so the sound plays at alarm volume and ducks media audio
        val soundUri = Uri.parse("android.resource://$packageName/${R.raw.mixkit_alert_bells_echo_765}")
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val channel = NotificationChannel(
            "rest_timer_end_v2",
            "Rest Timer End",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            setSound(soundUri, audioAttributes)
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 300, 200, 300)
        }
        nm.createNotificationChannel(channel)

        // Delete old channel that used USAGE_NOTIFICATION (too quiet)
        nm.deleteNotificationChannel("rest_timer_end")

        val notification = NotificationCompat.Builder(this, "rest_timer_end_v2")
            .setSmallIcon(R.drawable.ic_stat_kurvi_icon_ice_blue_transparent)
            .setContentTitle(finishedText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setTimeoutAfter(5000)
            .build()

        nm.notify(3002, notification)
    }

    private fun formatTime(millis: Long): String {
        val totalSeconds = (millis / 1000).coerceAtLeast(0)
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return String.format("%d:%02d", minutes, seconds)
    }

    override fun onDestroy() {
        countDownTimer?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
