package com.layer100crypto.MyTrack

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat


class AlarmService : Service() {

    private lateinit var mediaPlayer: MediaPlayer

    override fun onCreate() {
        super.onCreate()

        mediaPlayer = MediaPlayer.create(this, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI)
        mediaPlayer.isLooping = true
        mediaPlayer.start()

        startForeground(1, buildNotification())
    }

    private fun buildNotification(): Notification {
        val channelId = "alarm_service"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Active Alarm",
                NotificationManager.IMPORTANCE_HIGH
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        // Create intent to stop the alarm when notification is tapped
        val stopIntent = Intent(this, StopAlarmReceiver::class.java)
        val stopPendingIntent = PendingIntent.getBroadcast(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Alarm active")
            .setContentText("Tap to stop")
            .setSmallIcon(R.drawable.small_notification_icon)
            .setOngoing(true)
            .setContentIntent(stopPendingIntent)
            .setAutoCancel(true)

            return builder.build()
    }

    override fun onDestroy() {
        mediaPlayer.stop()
        mediaPlayer.release()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}