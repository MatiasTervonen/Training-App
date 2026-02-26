package com.layer100crypto.MyTrack.timer

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import android.app.PendingIntent
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R


class TimerService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("NativeTimer", "Timer Service started")

        val startTime = intent?.getLongExtra("startTime", 0L) ?: 0L
        val label = intent?.getStringExtra("label") ?: "Session"
        val mode = intent?.getStringExtra("mode") ?: "countup"
        val rawStatusText = intent?.getStringExtra("statusText")
        val statusText = rawStatusText ?: if (mode == "countdown") "Time remaining" else "In progress"
        Log.d("NativeTimer", "statusText received: '$rawStatusText', using: '$statusText'")

        val whenTime = startTime

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


        val builder = NotificationCompat.Builder(this, "timer_channel")
            .setContentTitle(label)
            .setContentText(statusText)
            .setSmallIcon(R.drawable.small_notification_icon)
            .setOngoing(true)
            .setUsesChronometer(true)
            .setWhen(whenTime)
            .setContentIntent(pendingIntent)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

            if(mode == "countdown") {
              builder.setChronometerCountDown(true)
            }

        startForeground(1, builder.build())
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

