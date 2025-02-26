package expo.modules.vibesreactnativeexpo

import com.vibes.vibes.PushPayloadParser

class PayloadWrapper(payload: PushPayloadParser) {
    private val payload: PushPayloadParser = payload

    val title: String
        get() = payload.getTitle()

    val body: String
        get() = payload.getBody()

    val channel: String
        get() = payload.getChannel()

    val notificationChannel: String
        get() = payload.getNotificationChannel()

    val isSilentPush: Boolean
        get() = payload.isSilentPush()

    val sound: String
        get() = payload.getSound()

    val richMediaUrl: String
        get() = payload.getRichPushMediaURL()

    val vibesCollapseId: String
        get() = payload.getVibesCollapseId()

    val priority: String
        get() = payload.getPriority()

    val customClientData: String
        get() = payload.getCustomClientData()

    @Override
    override fun toString(): String {
        return "PayloadWrapper{" +
                "title=" + title +
                ", body=" + body +
                ", channel=" + channel +
                ", notification_channel=" + notificationChannel +
                ", silent_push=" + isSilentPush +
                ", sound=" + sound +
                ", rich_media_url=" + richMediaUrl +
                ", vibes_collapse_id=" + vibesCollapseId +
                ", priority=" + priority +
                ", custom_client_data=" + customClientData +
                '}'
    }
}