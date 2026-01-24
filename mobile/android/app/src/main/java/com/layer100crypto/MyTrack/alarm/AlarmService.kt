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
    private var soundType: String = "default"
    private var alarmContent: String = ""
    private var reminderId: String = ""

    override fun onCreate() {
        super.onCreate()
        mediaPlayer = MediaPlayer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        alarmTitle = intent?.getStringExtra("TITLE") ?: "Alarm"
        soundType = intent?.getStringExtra("SOUND_TYPE") ?: "default"
        alarmContent = intent?.getStringExtra("CONTENT") ?: ""
        reminderId = intent?.getStringExtra("REMINDER_ID") ?: ""

        playSound(soundType)

        // Update the notification with the new title
        startForeground(2, buildNotification())

        return START_REDELIVER_INTENT
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

        // Determine route based on alarm type
        val route = if (soundType == "reminder" && reminderId.isNotEmpty()) {
            "mytrack://dashboard?reminderId=$reminderId"
        } else if (soundType == "reminder") {
            "mytrack://dashboard"
        } else {
            "mytrack://timer/empty-timer"
        }
        val contentText = if (soundType == "reminder") "Tap to open" else "Tap to open timer"

        // Create intent to open the appropriate page and stop the alarm
        val openIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse(route)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("stopAlarm", true)
        }

        val openPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val fullScreenIntent = Intent(this, AlarmActivity::class.java).apply {
            putExtra("SOUND_TYPE", soundType)
            putExtra("TITLE", alarmTitle)
            putExtra("CONTENT", alarmContent)
            putExtra("REMINDER_ID", reminderId)
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
            .setContentText(contentText)
            .setSmallIcon(R.drawable.small_notification_icon)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
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

