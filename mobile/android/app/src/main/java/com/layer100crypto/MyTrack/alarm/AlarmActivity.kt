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

class AlarmActivity : AppCompatActivity() {

    private var soundType: String = "default"
    private var reminderId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show on lock screen and turn screen on
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)

            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        setContentView(R.layout.activity_alarm)

        // Get title, soundType, content, reminderId, timesUpText, and stopAlarmText from intent
        val title = intent?.getStringExtra("TITLE") ?: "Timer"
        soundType = intent?.getStringExtra("SOUND_TYPE") ?: "default"
        val content = intent?.getStringExtra("CONTENT") ?: ""
        reminderId = intent?.getStringExtra("REMINDER_ID") ?: ""
        val timesUpText = intent?.getStringExtra("TIMES_UP_TEXT") ?: if (soundType == "reminder") "Reminder" else "Time's up!"
        val stopAlarmText = intent?.getStringExtra("STOP_ALARM_TEXT") ?: "Stop Alarm"

        // Customize UI based on alarm type
        if (soundType == "reminder") {
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
    }

    private fun stopAlarmAndOpenApp() {
        // Stop the alarm service
        stopService(Intent(this, AlarmService::class.java))

        // Send event to JS to stop the alarm sound
        ReactEventEmitter.sendStopAlarmSound(this)

        // Determine route based on alarm type
        val route = if (soundType == "reminder" && reminderId.isNotEmpty()) {
            "mytrack://dashboard?reminderId=$reminderId"
        } else if (soundType == "reminder") {
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
        startActivity(openIntent)

        // Close this activity
        finish()
    }
    
    override fun onBackPressed() {
        // Prevent back button from closing alarm without stopping it
        stopAlarmAndOpenApp()
    }
}
