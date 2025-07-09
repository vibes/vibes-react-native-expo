package expo.modules.vibessdk

import android.app.Application
import android.content.Context
import com.vibes.vibes.PushPayloadParser
import org.json.JSONObject
import java.util.HashMap

internal class PushEvtEmitter(private val context: Context) {
    private val appHelper: VibesAppHelper

    init {
        this.appHelper = VibesAppHelper(context.applicationContext as Application)
    }

    fun sendEvent(eventName: String, params: Map<String, Any>?, callback: (Boolean) -> Unit) {
        try {
            val event = HashMap<String, Any>()
            event["eventName"] = eventName
            params?.let { event["params"] = it }
            callback(true)
        } catch (e: Exception) {
            callback(false)
        }
    }

    fun notifyPushReceived(bundle: PushPayloadParser, callback: (Boolean) -> Unit) {
        val payload = bundle.map
        val params = HashMap<String, Any>()
        params["payload"] = payload
        sendEvent("pushReceived", params, callback)
    }

    fun notifyPushOpened(bundle: PushPayloadParser, callback: (Boolean) -> Unit) {
        appHelper.invokeApp()
        val payload = bundle.map
        val params = HashMap<String, Any>()
        params["payload"] = payload
        sendEvent("pushOpened", params, callback)
    }

    companion object {
        fun convertMap(data: Map<String, String>): Map<String, Any> {
            return data.mapValues { it.value }
        }
    }
}