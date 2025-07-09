package expo.modules.vibessdk

import android.app.Application
import android.content.Context
import android.content.Intent
import android.util.Log
import com.vibes.vibes.PushPayloadParser
import expo.modules.kotlin.Promise
import org.json.*
import java.util.HashMap

internal class VibesAppHelper(private val context: Context) {
    @Throws(JSONException::class)
    fun convertMapToJson(map: Map<String, Any>): JSONObject {
        return JSONObject().apply {
            map.forEach { (key, value) ->
                put(key, value)
            }
        }
    }

    val pushToken: String?
        get() = context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .getString("Vibes.PushToken", null)

    val deviceId: String?
        get() = context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .getString("Vibes.DeviceId", null)

    val deviceInfo: Map<String, String>
        get() = mapOf(
            "device_id" to (deviceId ?: ""),
            "push_token" to (pushToken ?: "")
        )

    fun saveString(key: String, value: String) {
        context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .edit()
            .putString(key, value)
            .apply()
    }

    fun invokeApp() {
        try {
            val packageName = context.packageName
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            launchIntent?.let {
                context.startActivity(it)
            }
        } catch (e: Exception) {
            Log.e("VibesReactNativeExpo", "Error launching app", e)
        }
    }
}