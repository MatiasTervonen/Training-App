-- Debuggin Native Mobile Code

Page where you are addin debug logs you need to import this 

import android.util.Log

Then you can add logs like this

Log.d("TAG", "This is a debug log message")


To start seeing logs run in fresh terminal when you run your app

adb logcat | grep "MyModule"

With this realiably to see the tag only you want to see

adb logcat -s Order:D

filter with the tag what you want to see. 

Filter out all the old buffer logs with this command 

adb logcat -c

-- REMEMBER ALWAYS REBUILD YOUR APP AFTER MAKING CHANGES TO NATIVE CODE