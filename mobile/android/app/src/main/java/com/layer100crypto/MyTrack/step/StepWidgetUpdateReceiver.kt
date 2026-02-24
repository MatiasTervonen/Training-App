package com.layer100crypto.MyTrack.step

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log

class StepWidgetUpdateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_USER_PRESENT) return

        Log.d(TAG, "Screen unlocked, triggering widget update")
        triggerWidgetUpdate(context)
    }

    companion object {
        private const val TAG = "StepWidget"

        fun triggerWidgetUpdate(context: Context) {
            try {
                val manager = AppWidgetManager.getInstance(context)
                val packageName = context.packageName
                val providerClassName = "$packageName.widget.Steps"
                val component = ComponentName(packageName, providerClassName)
                val ids = manager.getAppWidgetIds(component)

                Log.d(TAG, "Widget IDs found: ${ids.toList()}, provider: $providerClassName")

                if (ids.isNotEmpty()) {
                    val updateIntent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                        setComponent(component)
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    }
                    context.sendBroadcast(updateIntent)
                    Log.d(TAG, "Widget update broadcast sent for ${ids.size} widget(s)")
                } else {
                    Log.d(TAG, "No widgets placed, skipping update")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Widget update failed", e)
            }
        }
    }
}
