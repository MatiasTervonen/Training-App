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
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R
import com.layer100crypto.MyTrack.ReactEventEmitter


class AlarmService : Service() {

    companion object {
        // Static state to track current alarm
        var isRunning: Boolean = false
            private set
        var currentReminderId: String? = null
            private set
        var currentSoundType: String? = null
            private set
        var currentTitle: String? = null
            private set
        var currentContent: String? = null
            private set

        fun clearState() {
            isRunning = false
            currentReminderId = null
            currentSoundType = null
            currentTitle = null
            currentContent = null
        }
    }

    private lateinit var mediaPlayer: MediaPlayer
    private val handler = Handler(Looper.getMainLooper())
    private var notifyCount = 0

    private var alarmTitle: String = "Alarm"
    private var soundType: String = "default"
    private var alarmContent: String = ""
    private var reminderId: String = ""
    private var tapToOpenText: String = "Tap to open timer"
    private var timesUpText: String = "Time's up!"
    private var stopAlarmText: String = "Stop Alarm"
    private var snoozeText: String = "Snooze"

    override fun onCreate() {
        super.onCreate()
        mediaPlayer = MediaPlayer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        alarmTitle = intent?.getStringExtra("TITLE") ?: "Alarm"
        soundType = intent?.getStringExtra("SOUND_TYPE") ?: "default"
        alarmContent = intent?.getStringExtra("CONTENT") ?: ""
        reminderId = intent?.getStringExtra("REMINDER_ID") ?: ""
        tapToOpenText = intent?.getStringExtra("TAP_TO_OPEN_TEXT") ?: "Tap to open timer"
        timesUpText = intent?.getStringExtra("TIMES_UP_TEXT") ?: "Time's up!"
        stopAlarmText = intent?.getStringExtra("STOP_ALARM_TEXT") ?: "Stop Alarm"
        snoozeText = intent?.getStringExtra("SNOOZE_TEXT") ?: "Snooze"

        // Update static state
        isRunning = true
        currentReminderId = reminderId
        currentSoundType = soundType
        currentTitle = alarmTitle
        currentContent = alarmContent

        playSound(soundType)

        // Update the notification with the new title
        startForeground(2, buildNotification())

        // Re-post notification periodically to keep heads-up visible on Samsung One UI.
        // Samsung auto-collapses heads-up after ~5 seconds; re-notifying brings it back.
        notifyCount = 0
        handler.removeCallbacksAndMessages(null)
        scheduleHeadsUpRefresh()

        return START_REDELIVER_INTENT
    }

    private fun playSound(soundType: String) {
        if (mediaPlayer.isPlaying) {
            mediaPlayer.stop()
        }
        mediaPlayer.reset()

        val soundUri: Uri = when (soundType) {
            "timer" -> Uri.parse("android.resource://$packageName/${R.raw.mixkit_classic_alarm_995}")
            "reminder", "global-reminder" -> Uri.parse("android.resource://$packageName/${R.raw.mixkit_classic_alarm_995}")

            else ->
                android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI
        }

        mediaPlayer.setDataSource(this, soundUri)
        mediaPlayer.prepare()
        mediaPlayer.isLooping = true
        mediaPlayer.start()
    }

    private fun scheduleHeadsUpRefresh() {
        handler.postDelayed({
            if (isRunning && notifyCount < 6) { // Re-trigger up to 6 times (~30s total)
                notifyCount++
                val nm = getSystemService(NotificationManager::class.java)
                nm.notify(2, buildNotification())
                scheduleHeadsUpRefresh()
            }
        }, 5000) // Every 5 seconds
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
        val route = if ((soundType == "reminder" || soundType == "global-reminder") && reminderId.isNotEmpty()) {
            "mytrack://dashboard?reminderId=$reminderId"
        } else if (soundType == "reminder" || soundType == "global-reminder") {
            "mytrack://dashboard"
        } else {
            "mytrack://timer/empty-timer"
        }
        val contentText = tapToOpenText

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
            putExtra("TIMES_UP_TEXT", timesUpText)
            putExtra("STOP_ALARM_TEXT", stopAlarmText)
            putExtra("SNOOZE_TEXT", snoozeText)
            putExtra("TAP_TO_OPEN_TEXT", tapToOpenText)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_NO_USER_ACTION
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            1,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Stop action button on the notification itself (fallback for Samsung lock screen)
        val stopIntent = Intent(this, StopAlarmReceiver::class.java)
        val stopPendingIntent = PendingIntent.getBroadcast(
            this,
            2,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Snooze/extend action button
        val snoozeDurationMinutes = if (soundType == "reminder" || soundType == "global-reminder") 5 else 1
        val snoozeIntent = Intent(this, SnoozeAlarmReceiver::class.java).apply {
            putExtra("REMINDER_ID", reminderId)
            putExtra("TITLE", alarmTitle)
            putExtra("SOUND_TYPE", soundType)
            putExtra("CONTENT", alarmContent)
            putExtra("TAP_TO_OPEN_TEXT", tapToOpenText)
            putExtra("TIMES_UP_TEXT", timesUpText)
            putExtra("STOP_ALARM_TEXT", stopAlarmText)
            putExtra("SNOOZE_TEXT", snoozeText)
            putExtra("SNOOZE_DURATION_MINUTES", snoozeDurationMinutes)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            this,
            3,
            snoozeIntent,
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
            .addAction(0, stopAlarmText, stopPendingIntent)
            .addAction(0, snoozeText, snoozePendingIntent)
            .setUsesChronometer(true)
            .setWhen(System.currentTimeMillis())
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        return builder.build()
    }

    override fun onDestroy() {
        clearState()
        handler.removeCallbacksAndMessages(null)
        mediaPlayer.stop()
        mediaPlayer.release()
        // Notify JS to stop its alarm sound
        ReactEventEmitter.sendStopAlarmSound(this)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

