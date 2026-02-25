package com.layer100crypto.MyTrack.alarm

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.layer100crypto.MyTrack.MainActivity
import com.layer100crypto.MyTrack.R
import com.layer100crypto.MyTrack.ReactEventEmitter
import com.layer100crypto.MyTrack.timer.TimerService

class AlarmActivity : AppCompatActivity() {

    private var soundType: String = "default"
    private var reminderId: String = ""
    private var alarmTitle: String = ""
    private var alarmContent: String = ""
    private var tapToOpenText: String = "Tap to open"
    private var timesUpTextValue: String = ""
    private var stopAlarmTextValue: String = "Stop Alarm"
    private var snoozeTextValue: String = "Snooze"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show on lock screen and turn screen on
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            // NOTE: Do NOT call requestDismissKeyguard here — on Samsung One UI it
            // triggers an invisible overlay that steals touch focus, making the
            // Stop button unresponsive. Keyguard is dismissed later in
            // stopAlarmAndOpenApp() only when we actually need to open MainActivity.
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        // Keep screen on while alarm is showing (needed for Samsung power management)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_alarm)

        // Get title, soundType, content, reminderId, timesUpText, stopAlarmText, and snoozeText from intent
        val title = intent?.getStringExtra("TITLE") ?: "Timer"
        soundType = intent?.getStringExtra("SOUND_TYPE") ?: "default"
        val content = intent?.getStringExtra("CONTENT") ?: ""
        reminderId = intent?.getStringExtra("REMINDER_ID") ?: ""
        val timesUpText = intent?.getStringExtra("TIMES_UP_TEXT") ?: if (soundType == "reminder") "Reminder" else "Time's up!"
        val stopAlarmText = intent?.getStringExtra("STOP_ALARM_TEXT") ?: "Stop Alarm"
        snoozeTextValue = intent?.getStringExtra("SNOOZE_TEXT") ?: "Snooze"
        alarmTitle = title
        alarmContent = content
        tapToOpenText = intent?.getStringExtra("TAP_TO_OPEN_TEXT") ?: "Tap to open"
        timesUpTextValue = timesUpText
        stopAlarmTextValue = stopAlarmText

        // Customize UI based on alarm type
        if (soundType == "reminder" || soundType == "global-reminder") {
            // Reminder: Show mail icon
            findViewById<TextView>(R.id.alarmIcon).text = "📧"
            findViewById<TextView>(R.id.alarmSubtitle).text = timesUpText

            // Show content if available
            if (content.isNotEmpty()) {
                findViewById<TextView>(R.id.alarmContent).apply {
                    text = content
                    visibility = android.view.View.VISIBLE
                }
            }
        } else {
            // Timer: Show alarm clock icon
            findViewById<TextView>(R.id.alarmIcon).text = "⏰"
            findViewById<TextView>(R.id.alarmSubtitle).text = timesUpText
        }

        findViewById<TextView>(R.id.alarmTitle).text = title

        // Handle stop button click
        findViewById<Button>(R.id.stopButton).apply {
            text = stopAlarmText
            setOnClickListener {
                stopAlarmAndOpenApp()
            }
        }

        // Handle snooze/extend button
        val snoozeDurationMinutes = if (soundType == "reminder" || soundType == "global-reminder") 5 else 1
        val snoozeButtonLabel = snoozeTextValue
        findViewById<Button>(R.id.snoozeButton).apply {
            text = snoozeButtonLabel
            visibility = android.view.View.VISIBLE
            setOnClickListener {
                snoozeAlarm(snoozeDurationMinutes)
            }
        }
    }

    private fun snoozeAlarm(durationMinutes: Int) {
        // Stop the alarm service
        stopService(Intent(this, AlarmService::class.java))

        // Send event to JS to stop the alarm sound
        ReactEventEmitter.sendStopAlarmSound(this)

        // Schedule a new alarm N minutes from now, reusing the same ID
        val triggerAtMillis = System.currentTimeMillis() + durationMinutes * 60 * 1000L

        AlarmScheduler(this).schedule(
            triggerAtMillis = triggerAtMillis,
            reminderId = reminderId,
            title = alarmTitle,
            soundType = soundType,
            content = alarmContent,
            tapToOpenText = tapToOpenText,
            timesUpText = timesUpTextValue,
            stopAlarmText = stopAlarmTextValue,
            snoozeText = snoozeTextValue
        )

        // Notify JS to update DB for global reminders
        if (soundType == "global-reminder") {
            ReactEventEmitter.sendGlobalReminderSnoozed(
                this,
                reminderId,
                durationMinutes
            )
        }

        // Start countdown notification for timers
        if (soundType == "timer") {
            val timerIntent = Intent(this, TimerService::class.java).apply {
                putExtra("startTime", triggerAtMillis)
                putExtra("label", alarmTitle)
                putExtra("mode", "countdown")
            }
            startForegroundService(timerIntent)

            // Notify JS to update timer state
            ReactEventEmitter.sendTimerSnoozed(
                this,
                triggerAtMillis,
                durationMinutes * 60,
                alarmTitle
            )
        }

        // Close the activity without opening the app
        finish()
    }

    private fun stopAlarmAndOpenApp() {
        // Stop the alarm service
        stopService(Intent(this, AlarmService::class.java))

        // Send event to JS to stop the alarm sound
        ReactEventEmitter.sendStopAlarmSound(this)

        // Determine route based on alarm type
        val route = if ((soundType == "reminder" || soundType == "global-reminder") && reminderId.isNotEmpty()) {
            "mytrack://dashboard?reminderId=$reminderId"
        } else if (soundType == "reminder" || soundType == "global-reminder") {
            "mytrack://dashboard"
        } else {
            "mytrack://timer/empty-timer"
        }

        // Open the main app with appropriate page
        val openIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse(route)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("stopAlarm", true)
        }

        // Dismiss keyguard now (when user actually wants to open the app)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() {
                    startActivity(openIntent)
                    finish()
                }
                override fun onDismissCancelled() {
                    // User cancelled unlock — still stop alarm but stay on lock screen
                    finish()
                }
                override fun onDismissError() {
                    startActivity(openIntent)
                    finish()
                }
            })
        } else {
            startActivity(openIntent)
            finish()
        }
    }
    
    override fun onBackPressed() {
        // Prevent back button from closing alarm without stopping it
        stopAlarmAndOpenApp()
    }
}
