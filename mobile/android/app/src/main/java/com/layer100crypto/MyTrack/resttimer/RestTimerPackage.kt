package com.layer100crypto.MyTrack.resttimer

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class RestTimerPackage : ReactPackage {
    override fun createNativeModules(rc: ReactApplicationContext): List<NativeModule> =
        listOf(RestTimerModule(rc))

    override fun createViewManagers(rc: ReactApplicationContext) = emptyList<ViewManager<*, *>>()
}
