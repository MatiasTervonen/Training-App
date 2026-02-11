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

        val latch = CountDownLatch(1)
        var sensorValue: Long? = null

        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                sensorValue = event.values[0].toLong()
                latch.countDown()
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }

        sensorManager.registerListener(listener, stepSensor, SensorManager.SENSOR_DELAY_FASTEST)
        latch.await(timeoutMs, TimeUnit.MILLISECONDS)
        sensorManager.unregisterListener(listener)

        return sensorValue
    }

    fun recordReading() {
        val currentValue = readSensorValueSync() ?: return

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

        return if (currentValue < sessionStart) {
            // Reboot happened during session: treat current value as steps since boot
            currentValue
        } else {
            currentValue - sessionStart
        }
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
