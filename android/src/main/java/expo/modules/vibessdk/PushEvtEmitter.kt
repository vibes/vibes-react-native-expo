package expo.modules.vibessdk

import android.app.Application
import android.content.Context
import com.vibes.vibes.PushPayloadParser
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule

internal class PushEvtEmitter(private val context: ReactContext) {
    private val appHelper: VibesAppHelper
    init {
        this.appHelper = VibesAppHelper(context.applicationContext as Application)
    }

    fun sendEvent(eventName: String, params: WritableMap){
        val eventEmitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        eventEmitter.emit(eventName, params)
    }

    fun notifyPushReceived(bundle: PushPayloadParser) {
        val payload = bundle.map
        val params = Arguments.createMap()
        params.putMap("payload", convertMap(payload))
        sendEvent("pushReceived", params)
    }

    fun notifyPushOpened(bundle: PushPayloadParser) {
        appHelper.invokeApp()
        val payload = bundle.map
        val params = Arguments.createMap()
        params.putMap("payload", convertMap(payload))
        sendEvent("pushOpened", params)
    }

    companion object {
        fun convertMap(data: MutableMap<String?, String?>): WritableMap {
            val jsonString: String? = null
            val map: WritableMap = WritableNativeMap()
            for (entry in data.entries) {
                map.putString(entry.key!!, entry.value)
            }
            return map
        }
    }
}