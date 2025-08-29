package expo.modules.vibessdk

import android.app.Application
import android.content.Context
import android.content.Intent
import android.util.Log
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

    val latitude: String?
        get() = context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .getString("Vibes.Latitude", null)

    val longitude: String?
        get() = context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .getString("Vibes.Longitude", null)

    val deviceInfo: Map<String, Any>
        get() = mapOf(
            "device_id" to (deviceId ?: ""),
            "push_token" to (pushToken ?: ""),
            "latitude" to (latitude ?: ""),
            "longitude" to (longitude ?: ""),
            "is_registered" to (!deviceId.isNullOrEmpty()),
            "is_push_registered" to (!pushToken.isNullOrEmpty())
        )

    fun saveString(key: String, value: String) {
        context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .edit()
            .putString(key, value)
            .apply()
    }

    fun saveLatitude(lat: Double) {
        context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .edit()
            .putString("Vibes.Latitude", lat.toString())
            .apply()
    }

    fun saveLongitude(lon: Double) {
        context.getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
            .edit()
            .putString("Vibes.Longitude", lon.toString())
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