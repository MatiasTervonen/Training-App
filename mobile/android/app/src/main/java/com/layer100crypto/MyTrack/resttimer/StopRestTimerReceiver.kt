package com.layer100crypto.MyTrack.resttimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.layer100crypto.MyTrack.ReactEventEmitter

class StopRestTimerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        context.stopService(Intent(context, RestTimerService::class.java))
        ReactEventEmitter.sendRestTimerSkipped(context)
    }
}
