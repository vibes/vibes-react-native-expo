package expo.modules.vibessdk

import com.vibes.vibes.PushPayloadParser

class PayloadWrapper(private val payload: PushPayloadParser) {
    val title: String
        get() = payload.getTitle() ?: ""

    val body: String
        get() = payload.getBody() ?: ""

    val channel: String
        get() = payload.getChannel() ?: ""

    val notificationChannel: String
        get() = payload.getNotificationChannel() ?: ""

    val isSilentPush: Boolean
        get() = payload.isSilentPush()

    val sound: String
        get() = payload.getSound() ?: ""

    val richMediaUrl: String
        get() = payload.getRichPushMediaURL() ?: ""

    val vibesCollapseId: String
        get() = payload.getVibesCollapseId() ?: ""

    val priority: String
        get() = payload.getPriority()?.toString() ?: ""

    val customClientData: String
        get() = payload.getCustomClientData()?.toString() ?: ""

    override fun toString(): String {
        return "PayloadWrapper{" +
                "title=$title" +
                ", body=$body" +
                ", channel=$channel" +
                ", notification_channel=$notificationChannel" +
                ", silent_push=$isSilentPush" +
                ", sound=$sound" +
                ", rich_media_url=$richMediaUrl" +
                ", vibes_collapse_id=$vibesCollapseId" +
                ", priority=$priority" +
                ", custom_client_data=$customClientData" +
                "}"
    }
}