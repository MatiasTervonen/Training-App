package com.layer100crypto.MyTrack

import android.content.Context
import android.content.Intent
import android.provider.Settings

fun requestExactAlarmPermission(context: Context) {
    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    context.startActivity(intent)
}