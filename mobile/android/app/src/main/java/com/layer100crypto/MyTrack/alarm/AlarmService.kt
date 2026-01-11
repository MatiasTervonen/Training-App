package com.layer100crypto.MyTrack.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R


class AlarmService : Service() {

    private lateinit var mediaPlayer: MediaPlayer

    private var alarmTitle: String = "Alarm"

    override fun onCreate() {
        super.onCreate()
        mediaPlayer = MediaPlayer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        alarmTitle = intent?.getStringExtra("TITLE") ?: "Alarm"

        val soundType = intent?.getStringExtra("SOUND_TYPE") ?: "default"

        playSound(soundType)

        // Update the notification with the new title
        startForeground(1, buildNotification())

        return START_NOT_STICKY
    }

    private fun playSound(soundType: String) {
        if (mediaPlayer.isPlaying) {
            mediaPlayer.stop()
        }
        mediaPlayer.reset()

        val soundUri: Uri = when (soundType) {
            "timer" -> Uri.parse("android.resource://$packageName/${R.raw.mixkit_classic_alarm_995}")
            "reminder" -> Uri.parse("android.resource://$packageName/${R.raw.mixkit_classic_alarm_995}")          

            else ->
                android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI
        }

        mediaPlayer.setDataSource(this, soundUri)
        mediaPlayer.prepare()
        mediaPlayer.isLooping = true
        mediaPlayer.start()
    }

    private fun buildNotification(): Notification {
        val channelId = "alarm_service_1"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Active Alarm",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alarm notifications"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setBypassDnd(true)
                setSound(null, null) // Sound is handled by MediaPlayer
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        // Create intent to open the timer page and stop the alarm
        val openTimerIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("mytrack://timer/empty-timer")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("stopAlarm", true)
        }
        
        val openTimerPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openTimerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val fullScreenIntent = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_NO_USER_ACTION
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            1,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle(alarmTitle)
            .setContentText("Tap to open timer")
            .setSmallIcon(R.drawable.small_notification_icon)
            .setOngoing(true)
            .setContentIntent(openTimerPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(false)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        return builder.build()
    }

    override fun onDestroy() {
        mediaPlayer.stop()
        mediaPlayer.release()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

