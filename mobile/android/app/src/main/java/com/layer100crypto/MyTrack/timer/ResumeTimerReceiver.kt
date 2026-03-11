package com.layer100crypto.MyTrack.timer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.layer100crypto.MyTrack.ReactEventEmitter

class ResumeTimerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        ReactEventEmitter.sendTimerResumed(context)
    }
}
