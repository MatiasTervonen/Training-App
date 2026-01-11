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
        
        // Get title from intent
        val title = intent?.getStringExtra("TITLE") ?: "Timer"
        findViewById<TextView>(R.id.alarmTitle).text = title
        
        // Handle stop button click
        findViewById<Button>(R.id.stopButton).setOnClickListener {
            stopAlarmAndOpenApp()
        }
    }
    
    private fun stopAlarmAndOpenApp() {
        // Stop the alarm service
        stopService(Intent(this, AlarmService::class.java))
        
        // Send event to JS to stop the alarm sound
        ReactEventEmitter.sendStopAlarmSound(this)
        
        // Open the main app with timer page
        val openTimerIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("mytrack://timer/empty-timer")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("stopAlarm", true)
        }
        startActivity(openTimerIntent)
        
        // Close this activity
        finish()
    }
    
    override fun onBackPressed() {
        // Prevent back button from closing alarm without stopping it
        stopAlarmAndOpenApp()
    }
}
