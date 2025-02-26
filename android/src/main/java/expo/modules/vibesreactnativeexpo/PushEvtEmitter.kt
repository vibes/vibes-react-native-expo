package expo.modules.vibesreactnativeexpo

import android.app.Application
import android.content.Context
import com.vibes.vibes.PushPayloadParser
import expo.modules.kotlin.Promise
import org.json.*
import java.util.HashMap

internal class PushEvtEmitter(context: Context) {
    private val context: Context
    private val appHelper: VibesAppHelper

    init {
        this.context = context
        this.appHelper = VibesAppHelper(context.getApplicationContext() as Application?)
    }

    fun sendEvent(eventName: String?, params: Map<String?, Object?>?, promise: Promise) {
        try {
            val event: Map<String, Object> = HashMap()
            event.put("eventName", eventName)
            event.put("params", params)
            promise.resolve(event)
        } catch (e: Exception) {
            promise.reject("SEND_EVENT_ERROR", "Failed to send event", e)
        }
    }

    fun notifyPushReceived(bundle: PushPayloadParser, promise: Promise) {
        val payload: Map<String, String> = bundle.getMap()
        val params: Map<String?, Object> = HashMap()
        params.put("payload", payload)
        sendEvent("pushReceived", params, promise)
    }

    fun notifyPushOpened(bundle: PushPayloadParser, promise: Promise) {
        appHelper.invokeApp()
        val payload: Map<String, String> = bundle.getMap()
        val params: Map<String?, Object> = HashMap()
        params.put("payload", payload)
        sendEvent("pushOpened", params, promise)
    }

    companion object {
        fun convertMap(data: Map<String?, String?>): Map<String, Object> {
            val map: Map<String, Object> = HashMap()
            for (entry: Map.Entry<String?, String?> in data.entrySet()) {
                map.put(entry.getKey(), entry.getValue())
            }
            return map
        }
    }
}