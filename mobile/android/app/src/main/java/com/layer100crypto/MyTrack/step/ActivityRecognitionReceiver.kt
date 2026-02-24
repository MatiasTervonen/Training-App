package com.layer100crypto.MyTrack.step

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.ActivityRecognitionResult
import com.google.android.gms.location.DetectedActivity

class ActivityRecognitionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ActivityRecognition"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (!ActivityRecognitionResult.hasResult(intent)) return

        val result = ActivityRecognitionResult.extractResult(intent) ?: return
        val activity = result.mostProbableActivity

        Log.d(TAG, "Detected: ${activityName(activity.type)} (confidence: ${activity.confidence}%)")

        val prefs = context.getSharedPreferences("step_counter_prefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        editor.putInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_TYPE, activity.type)
        editor.putInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_CONFIDENCE, activity.confidence)

        // Track when the user was last detected as moving
        if (activity.type in listOf(
                DetectedActivity.WALKING,
                DetectedActivity.RUNNING,
                DetectedActivity.ON_FOOT
            ) && activity.confidence >= 70
        ) {
            editor.putLong(StepCounterHelper.KEY_LAST_WALKING_TIMESTAMP, System.currentTimeMillis())
        }

        editor.apply()
    }

    private fun activityName(type: Int): String = when (type) {
        DetectedActivity.WALKING -> "WALKING"
        DetectedActivity.RUNNING -> "RUNNING"
        DetectedActivity.ON_FOOT -> "ON_FOOT"
        DetectedActivity.STILL -> "STILL"
        DetectedActivity.IN_VEHICLE -> "IN_VEHICLE"
        DetectedActivity.ON_BICYCLE -> "ON_BICYCLE"
        DetectedActivity.TILTING -> "TILTING"
        DetectedActivity.UNKNOWN -> "UNKNOWN"
        else -> "OTHER($type)"
    }
}
