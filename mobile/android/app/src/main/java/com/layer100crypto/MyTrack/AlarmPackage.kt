package com.layer100crypto.MyTrack

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AlarmPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext) =
        listOf(NativeAlarmModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext) =
        emptyList<ViewManager<*, *>>()
}