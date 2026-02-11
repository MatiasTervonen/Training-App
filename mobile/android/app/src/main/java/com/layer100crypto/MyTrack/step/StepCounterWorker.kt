package com.layer100crypto.MyTrack.step

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

class StepCounterWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        val helper = StepCounterHelper(applicationContext)
        if (!helper.hasSensor()) return Result.success()
        helper.recordReading()
        return Result.success()
    }
}
