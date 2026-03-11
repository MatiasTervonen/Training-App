package com.layer100crypto.MyTrack.timer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.layer100crypto.MyTrack.ReactEventEmitter

class PauseTimerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Notify JS side — it will pause the timer state and update the notification
        ReactEventEmitter.sendStopTimer(context)
    }
}
