package com.layer100crypto.MyTrack.step

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class StepWidgetUpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_USER_PRESENT) return

        val helper = StepCounterHelper(context)
        if (!helper.hasSensor()) return

        // Record latest sensor reading → updates SharedPreferences
        helper.recordReading()

        // Trigger widget refresh
        triggerWidgetUpdate(context)
    }

    companion object {
        fun triggerWidgetUpdate(context: Context) {
            try {
                val manager = AppWidgetManager.getInstance(context)
                val packageName = context.packageName
                val providerClassName = "$packageName.StepsWidgetProvider"
                val component = ComponentName(packageName, providerClassName)
                val ids = manager.getAppWidgetIds(component)
                if (ids.isNotEmpty()) {
                    val updateIntent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                        setComponent(component)
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    }
                    context.sendBroadcast(updateIntent)
                }
            } catch (e: Exception) {
                // Widget provider not found, widget may not be placed
            }
        }
    }
}
