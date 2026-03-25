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
        private const val MAX_HISTORY_DAYS = 60
        // Safety cap: no single sensor event can produce more than 100K steps.
        // Prevents inflated counts from sensor glitches or false reboot detection.
        private const val MAX_SINGLE_DELTA = 100_000L
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
            currentValue < lastValue -> 0L // Reboot or sensor glitch: re-anchor without adding steps
            else -> currentValue - lastValue
        }

        // Safety: discard impossibly large deltas (sensor glitch / corrupted lastValue)
        if (delta in 1..MAX_SINGLE_DELTA) {
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

    fun startSession(): Long? {
        val currentValue = readSensorValueSync() ?: return null
        prefs.edit()
            .putLong(KEY_SESSION_START_VALUE, currentValue)
            .apply()
        return currentValue
    }

    fun getSessionSteps(): Long {
        val currentValue = readSensorValueSync() ?: return 0L
        val sessionStart = prefs.getLong(KEY_SESSION_START_VALUE, -1L)

        if (sessionStart == -1L) return 0L

        val rawSteps = if (currentValue < sessionStart) {
            currentValue // reboot: treat current value as steps since reboot
        } else {
            currentValue - sessionStart
        }

        // Cap to prevent inflated values from sensor glitches
        return rawSteps.coerceIn(0L, MAX_SINGLE_DELTA)
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
