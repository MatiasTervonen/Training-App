package com.layer100crypto.MyTrack.notifications

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.RemoteMessageSerializer
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.RemoteNotificationContent
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate
import org.json.JSONObject
import java.util.Date
import java.util.UUID

/**
 * Extends expo-notifications' delegate to handle chat notification replacement on Android.
 *
 * Android chat notifications are sent as data-only FCM messages (no notification payload)
 * so that onMessageReceived fires in ALL app states (foreground, background, killed).
 * This delegate extracts title/message/tag from Expo's nested body JSON, builds the
 * notification content, and uses the tag as the notification identifier — Android
 * automatically replaces notifications with the same tag.
 */
class ChatFirebaseMessagingDelegate(context: Context) : FirebaseMessagingDelegate(context) {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val chatData = parseChatData(remoteMessage)

        if (chatData != null) {
            // Chat message: build content manually with title/text from body JSON
            // so shouldPresent() returns true, and use the tag as identifier for replacement.
            val content = NotificationContent.Builder()
                .setTitle(chatData.title)
                .setText(chatData.message)
                .setBody(chatData.body)
                .build()

            val trigger = FirebaseNotificationTrigger(remoteMessage)
            val request = createNotificationRequest(chatData.tag, content, trigger)
            val notification = Notification(request, Date(remoteMessage.sentTime))

            NotificationsService.receive(context, notification)
            runTaskManagerTasks(
                context.applicationContext,
                RemoteMessageSerializer.toBundle(remoteMessage)
            )
        } else {
            // Non-chat notification: use expo's default handling
            super.onMessageReceived(remoteMessage)
        }
    }

    private data class ChatData(
        val tag: String,
        val title: String,
        val message: String,
        val body: JSONObject
    )

    private fun parseChatData(remoteMessage: RemoteMessage): ChatData? {
        val bodyString = remoteMessage.data["body"] ?: return null

        return try {
            val json = JSONObject(bodyString)
            if (json.optString("type") != "chat_message") return null

            val tag = json.optString("tag", "")
            val title = json.optString("title", "")
            val message = json.optString("message", "")

            if (tag.isEmpty() || title.isEmpty()) return null

            ChatData(tag, title, message, json)
        } catch (_: Exception) {
            null
        }
    }
}
