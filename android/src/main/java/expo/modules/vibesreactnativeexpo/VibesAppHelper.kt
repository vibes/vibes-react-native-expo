package expo.modules.vibesreactnativeexpo

import android.app.Application
import android.content.Context
import android.content.Intent
import android.util.Log
import com.vibes.vibes.PushPayloadParser
import expo.modules.kotlin.Promise
import org.json.*
import java.util.HashMap

internal class VibesAppHelper(context: Application) {
    private val context: Context

    init {
        this.context = context
    }

    @kotlin.Throws(JSONException::class)
    fun convertMapToJson(map: Map<String?, Object?>): JSONObject {
        val `object`: JSONObject = JSONObject()
        for (entry: Map.Entry<String?, Object?> in map.entrySet()) {
            `object`.put(entry.getKey(), entry.getValue())
        }
        return `object`
    }

    val pushToken: String
        get() {
            return context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
                .getString("Vibes.PushToken", null)
        }

    val deviceId: String
        get() {
            return context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
                .getString("Vibes.DeviceId", null)
        }

    val deviceInfo: Map<String, String>
        get() {
            val map: Map<String, String> = HashMap()
            map.put("device_id", deviceId)
            map.put("push_token", pushToken)
            return map
        }

    fun invokeApp() {
        try {
            val packageName: String = context.getPackageName()
            val launchIntent: Intent? =
                context.getPackageManager().getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                context.startActivity(launchIntent)
            }
        } catch (e: Exception) {
            Log.e("VibesReactNativeExpo", "Error launching app", e)
        }
    }
}

internal class PushEvtEmitter(context: Context) {
    private val context: Context
    private val appHelper: VibesAppHelper

    init {
        this.context = context
        this.appHelper = VibesAppHelper(context.getApplicationContext() as Application)
    }

    fun notifyPushReceived(bundle: PushPayloadParser, promise: Promise) {
        val payload: Map<String, String> = bundle.getMap()
        val params: Map<String, Object> = HashMap()
        params.put("payload", payload)
        promise.resolve(params)
    }

    fun notifyPushOpened(bundle: PushPayloadParser, promise: Promise) {
        appHelper.invokeApp()
        val payload: Map<String, String> = bundle.getMap()
        val params: Map<String, Object> = HashMap()
        params.put("payload", payload)
        promise.resolve(params)
    }
}