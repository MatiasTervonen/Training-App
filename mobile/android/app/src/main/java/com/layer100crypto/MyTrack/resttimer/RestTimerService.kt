package com.layer100crypto.MyTrack.resttimer

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import android.app.PendingIntent
import android.app.NotificationChannel
import android.app.NotificationManager
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R

class RestTimerService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("RestTimer", "Rest Timer Service started")

        val endTime = intent?.getLongExtra("endTime", 0L) ?: 0L
        val label = intent?.getStringExtra("label") ?: "Rest"
        val statusText = intent?.getStringExtra("statusText") ?: "Resting"
        val cancelText = intent?.getStringExtra("cancelText") ?: "Skip"

        // Create notification channel
        val channel = NotificationChannel(
            "rest_timer_channel",
            "Rest Timer",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

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

        val builder = NotificationCompat.Builder(this, "rest_timer_channel")
            .setContentTitle(label)
            .setContentText(statusText)
            .setSmallIcon(R.drawable.small_notification_icon)
            .setOngoing(true)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setWhen(endTime)
            .setContentIntent(pendingIntent)
            .addAction(0, cancelText, cancelPendingIntent)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        startForeground(3, builder.build())
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
