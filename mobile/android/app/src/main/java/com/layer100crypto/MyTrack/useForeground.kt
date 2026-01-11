package com.layer100crypto.MyTrack

import android.app.Application
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import android.util.Log

object AppForegroundState {

    @Volatile
    private var isForeground = false

    fun init(application: Application) {
        ProcessLifecycleOwner.get().lifecycle.addObserver(
            object : DefaultLifecycleObserver {

                override fun onStart(owner: LifecycleOwner) {
                    isForeground = true
                    Log.d("AppForegroundState", "App entered foreground")
                }

                override fun onStop(owner: LifecycleOwner) {
                    isForeground = false
                    Log.d("AppForegroundState", "App entered background")
                }
            }
        )
    }

    fun isForeground(): Boolean = isForeground
}