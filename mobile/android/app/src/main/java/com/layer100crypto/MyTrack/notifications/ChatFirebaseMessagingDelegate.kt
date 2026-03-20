package com.layer100crypto.MyTrack.notifications

import android.content.Context
import android.os.Bundle
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.RemoteMessageSerializer
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.RemoteNotificationContent
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate
import org.json.JSONObject
import java.util.Date
import java.util.UUID

/**
 * Extends expo-notifications' delegate to extract `tag` from the Expo push data body JSON.
 * Expo nests custom `data` fields inside `remoteMessage.data["body"]` as a JSON string,
 * so the default `getNotificationIdentifier` never sees our `tag` field.
 *
 * When a `tag` is present, notifications with the same tag replace each other in the tray.
 */
class ChatFirebaseMessagingDelegate(context: Context) : FirebaseMessagingDelegate(context) {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val identifier = getTagAwareIdentifier(remoteMessage)
        val content = RemoteNotificationContent(remoteMessage)
        val trigger = FirebaseNotificationTrigger(remoteMessage)
        val request = createNotificationRequest(identifier, content, trigger)
        val notification = Notification(request, Date(remoteMessage.sentTime))

        NotificationsService.receive(context, notification)
        runTaskManagerTasks(
            context.applicationContext,
            RemoteMessageSerializer.toBundle(remoteMessage)
        )
    }

    private fun getTagAwareIdentifier(remoteMessage: RemoteMessage): String {
        // First check top-level data (expo's default behavior)
        remoteMessage.data["tag"]?.let { return it }

        // Then check inside body JSON where Expo nests our custom data fields
        remoteMessage.data["body"]?.let { bodyString ->
            try {
                val json = JSONObject(bodyString)
                val tag = json.optString("tag", "")
                if (tag.isNotEmpty()) return tag
            } catch (_: Exception) {}
        }

        return remoteMessage.messageId ?: UUID.randomUUID().toString()
    }
}
