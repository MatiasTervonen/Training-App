package com.layer100crypto.MyTrack.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.layer100crypto.MyTrack.AppForegroundState
import com.layer100crypto.MyTrack.ReactEventEmitter

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {

        val reminderId = intent.getStringExtra("REMINDER_ID")
        val title = intent.getStringExtra("TITLE") ?: "Alarm"
        val soundType = intent.getStringExtra("SOUND_TYPE") ?: "default"

         val deliveredToJs =
            AppForegroundState.isForeground() &&
            ReactEventEmitter.sendTimerFinished(context, reminderId, title)

        if (!deliveredToJs) {
            val serviceIntent = Intent(context, AlarmService::class.java).apply {
                putExtra("REMINDER_ID", reminderId)
                putExtra("TITLE", title)
                putExtra("SOUND_TYPE", soundType)
            }
            ContextCompat.startForegroundService(context, serviceIntent)

        }
    }
}

