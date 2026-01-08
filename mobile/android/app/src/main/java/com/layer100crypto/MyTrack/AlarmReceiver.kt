package com.layer100crypto.MyTrack

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("REMINDER_ID", intent.getStringExtra("REMINDER_ID"))
        }

        ContextCompat.startForegroundService(context, serviceIntent)
    }
}