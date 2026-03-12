package com.layer100crypto.MyTrack.step

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class StepGoalTaskService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras ?: return null
        val data = Arguments.createMap().apply {
            putString("habitId", extras.getString("habitId"))
            putString("date", extras.getString("date"))
        }
        return HeadlessJsTaskConfig(
            "StepGoalTask",
            data,
            15000,
            true
        )
    }
}
