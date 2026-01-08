package com.layer100crypto.MyTrack

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

import android.app.PendingIntent


class TimerService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("NativeTimer", "Timer Service started")

        val startTime = intent?.getLongExtra("startTime", 0L) ?: 0L

        val label = intent?.getStringExtra("label") ?: "Session"


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


        val notification = NotificationCompat.Builder(this, "timer_channel")
            .setContentTitle(label)
            .setContentText("In progress")
            .setSmallIcon(R.drawable.small_notification_icon)
            .setOngoing(true)
            .setUsesChronometer(true)
            .setWhen(startTime)
            .setContentIntent(pendingIntent)
            .build()

        startForeground(1, notification)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}