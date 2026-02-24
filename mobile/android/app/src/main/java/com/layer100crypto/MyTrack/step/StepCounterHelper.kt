package com.layer100crypto.MyTrack.step

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class StepCounterHelper(private val context: Context) {

    companion object {
        private const val PREFS_NAME = "step_counter_prefs"
        private const val KEY_LAST_SENSOR_VALUE = "last_sensor_value"
        private const val KEY_LAST_READ_TIME = "last_read_time"
        private const val KEY_DAILY_STEPS = "daily_steps"
        private const val KEY_SESSION_START_VALUE = "session_start_value"
        const val KEY_CURRENT_ACTIVITY_TYPE = "current_activity_type"
        const val KEY_CURRENT_ACTIVITY_CONFIDENCE = "current_activity_confidence"
        const val KEY_LAST_WALKING_TIMESTAMP = "last_walking_timestamp"
        private const val KEY_SESSION_FILTERED_STEPS = "session_filtered_steps"
        private const val KEY_SESSION_LAST_LIVE_SENSOR = "session_last_live_sensor"
        private const val MAX_HISTORY_DAYS = 60
    }

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun hasSensor(): Boolean {
        val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        return sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
    }

    fun readSensorValueSync(timeoutMs: Long = 5000L): Long? {
        val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return null

        for (attempt in 1..3) {
            val latch = CountDownLatch(1)
            var sensorValue: Long? = null

            val listener = object : SensorEventListener {
                override fun onSensorChanged(event: SensorEvent) {
                    sensorValue = event.values[0].toLong()
                    latch.countDown()
                }
                override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
            }

            // maxReportLatencyUs = 0 disables batching, forces immediate delivery
            sensorManager.registerListener(listener, stepSensor, SensorManager.SENSOR_DELAY_FASTEST, 0)
            // Flush any pending sensor events to trigger immediate delivery
            sensorManager.flush(listener)
            latch.await(timeoutMs, TimeUnit.MILLISECONDS)
            sensorManager.unregisterListener(listener)

            if (sensorValue != null) return sensorValue
        }

        return null
    }

    fun recordReading() {
        val currentValue = readSensorValueSync() ?: return
        recordReadingWithValue(currentValue)
    }

    fun recordReadingWithValue(currentValue: Long) {

        val lastValue = prefs.getLong(KEY_LAST_SENSOR_VALUE, -1L)
        val today = dateFormat.format(Date())

        val delta = when {
            lastValue == -1L -> 0L // First ever read, no delta yet
            currentValue < lastValue -> currentValue // Reboot detected: sensor reset to 0, treat current as new steps
            else -> currentValue - lastValue
        }

        if (delta > 0) {
            val dailySteps = loadDailySteps()
            val currentDaySteps = dailySteps.optLong(today, 0L)
            dailySteps.put(today, currentDaySteps + delta)
            pruneOldDays(dailySteps)
            saveDailySteps(dailySteps)
        }

        prefs.edit()
            .putLong(KEY_LAST_SENSOR_VALUE, currentValue)
            .putLong(KEY_LAST_READ_TIME, System.currentTimeMillis())
            .apply()
    }

    fun getTodaySteps(): Long {
        val today = dateFormat.format(Date())
        val dailySteps = loadDailySteps()
        return dailySteps.optLong(today, 0L)
    }

    fun getStepsForDate(dateString: String): Long {
        val dailySteps = loadDailySteps()
        return dailySteps.optLong(dateString, 0L)
    }

    fun getDailyStepsHistory(days: Int): JSONObject {
        val dailySteps = loadDailySteps()
        val result = JSONObject()
        val keys = dailySteps.keys()
        val cutoffDate = dateFormat.format(Date(System.currentTimeMillis() - days.toLong() * 24 * 60 * 60 * 1000))

        while (keys.hasNext()) {
            val key = keys.next()
            if (key >= cutoffDate) {
                result.put(key, dailySteps.getLong(key))
            }
        }
        return result
    }

    fun updateLastSensorValue(currentValue: Long) {
        prefs.edit()
            .putLong(KEY_LAST_SENSOR_VALUE, currentValue)
            .putLong(KEY_LAST_READ_TIME, System.currentTimeMillis())
            .apply()
    }

    fun startSession(): Long? {
        val currentValue = readSensorValueSync() ?: return null
        prefs.edit()
            .putLong(KEY_SESSION_START_VALUE, currentValue)
            .putLong(KEY_SESSION_FILTERED_STEPS, 0L)
            .putLong(KEY_SESSION_LAST_LIVE_SENSOR, currentValue)
            .apply()
        return currentValue
    }

    fun getSessionSteps(): Long {
        val currentValue = readSensorValueSync() ?: return 0L
        val sessionStart = prefs.getLong(KEY_SESSION_START_VALUE, -1L)
        val filteredSteps = prefs.getLong(KEY_SESSION_FILTERED_STEPS, 0L)

        if (sessionStart == -1L) return 0L

        val rawSteps = if (currentValue < sessionStart) {
            currentValue
        } else {
            currentValue - sessionStart
        }

        return maxOf(rawSteps - filteredSteps, 0L)
    }

    fun getSessionFilteredSteps(): Long {
        return prefs.getLong(KEY_SESSION_FILTERED_STEPS, 0L)
    }

    fun addSessionFilteredSteps(delta: Long) {
        val current = prefs.getLong(KEY_SESSION_FILTERED_STEPS, 0L)
        prefs.edit()
            .putLong(KEY_SESSION_FILTERED_STEPS, current + delta)
            .apply()
    }

    fun getSessionLastLiveSensor(): Long {
        return prefs.getLong(KEY_SESSION_LAST_LIVE_SENSOR, -1L)
    }

    fun setSessionLastLiveSensor(value: Long) {
        prefs.edit()
            .putLong(KEY_SESSION_LAST_LIVE_SENSOR, value)
            .apply()
    }

    private fun loadDailySteps(): JSONObject {
        val json = prefs.getString(KEY_DAILY_STEPS, null) ?: return JSONObject()
        return try {
            JSONObject(json)
        } catch (e: Exception) {
            JSONObject()
        }
    }

    private fun saveDailySteps(dailySteps: JSONObject) {
        prefs.edit()
            .putString(KEY_DAILY_STEPS, dailySteps.toString())
            .apply()
    }

    private fun pruneOldDays(dailySteps: JSONObject) {
        val cutoffDate = dateFormat.format(
            Date(System.currentTimeMillis() - MAX_HISTORY_DAYS.toLong() * 24 * 60 * 60 * 1000)
        )
        val keysToRemove = mutableListOf<String>()
        val keys = dailySteps.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            if (key < cutoffDate) {
                keysToRemove.add(key)
            }
        }
        keysToRemove.forEach { dailySteps.remove(it) }
    }
}
