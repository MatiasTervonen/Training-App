# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# expo-notifications: keep serialization methods and model classes
# R8 strips writeObject/readObject which breaks Java serialization of scheduled notifications
-keep class expo.modules.notifications.notifications.model.** { *; }
-keep class expo.modules.notifications.notifications.triggers.** { *; }
-keep class expo.modules.notifications.notifications.interfaces.** { *; }
-keep class expo.modules.notifications.service.delegates.** { *; }

# expo-task-manager: keep task consumer classes (instantiated via reflection)
-keep class expo.modules.notifications.notifications.background.** { *; }
-keep class expo.modules.taskManager.** { *; }
-keep class expo.modules.interfaces.taskManager.** { *; }

# Add any project specific keep options here:
