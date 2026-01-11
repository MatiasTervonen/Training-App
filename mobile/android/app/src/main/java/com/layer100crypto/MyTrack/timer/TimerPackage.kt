package com.layer100crypto.MyTrack.timer

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class TimerPackage : ReactPackage {
  override fun createNativeModules(rc: ReactApplicationContext) =
    listOf(TimerModule(rc))

  override fun createViewManagers(rc: ReactApplicationContext) = emptyList<ViewManager<*, *>>()
}

