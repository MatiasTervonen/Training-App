package com.layer100crypto.MyTrack.notifications

import expo.modules.notifications.service.ExpoFirebaseMessagingService
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

/**
 * Custom Firebase messaging service that uses [ChatFirebaseMessagingDelegate]
 * to extract notification tags from Expo's nested data payload.
 * This enables Android notification replacement for same-conversation chat messages.
 */
class ChatFirebaseMessagingService : ExpoFirebaseMessagingService() {
    override val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
        ChatFirebaseMessagingDelegate(this)
    }
}
