package expo.modules.vibesreactnativeexpo

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.vibes.vibes.PushPayloadParser
import com.vibes.vibes.Vibes
import com.vibes.vibes.VibesConfig

class Fms : FirebaseMessagingService() {
    private var pushModel: PushPayloadParser? = null
    private var message: RemoteMessage? = null
    private var preferences: SharedPreferences? = null

    @Override
    fun onCreate() {
        super.onCreate()
        preferences = getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
    }

    @Override
    fun onMessageReceived(message: RemoteMessage) {
        Log.d(TAG, "Push message received. Processing")
        this.message = message
        this.pushModel = createPushPayloadParser(message.getData())

        if (!initializeVibes()) {
            return
        }
        handleNotification(pushModel, message)
    }

    @Override
    fun onNewToken(pushToken: String) {
        super.onNewToken(pushToken)
        Log.d(TAG, "Firebase token obtained from Fms as " + pushToken)
        preferences.edit().putString("Vibes.PushToken", pushToken).apply()
    }

    private fun initializeVibes(): Boolean {
        try {
            Vibes.getInstance()
            return true
        } catch (e: Exception) {
            initializeVibesAsync()
            return false
        }
    }

    private fun initializeVibesAsync() {
        try {
            val ai: ApplicationInfo = getPackageManager().getApplicationInfo(
                getPackageName(),
                PackageManager.GET_META_DATA
            )
            val bundle: Bundle = ai.metaData
            Handler(Looper.getMainLooper()).post({
                val appId: String = bundle.getString("com.vibes.push.rn.plugin.appId")
                val apiUrl: String? = bundle.getString("com.vibes.push.rn.plugin.apiUrl")

                val config: VibesConfig = Builder()
                    .setAppId(appId)
                    .setApiUrl(if (apiUrl != null && !apiUrl.isEmpty()) apiUrl else null)
                    .build()
                Log.d(
                    TAG,
                    "Initializing Vibes with appId=[" + appId + "] and apiUrl=[" + apiUrl + "]"
                )
                Vibes.initialize(this, config)
                handleNotification(pushModel, message)
            })
        } catch (e: PackageManager.NameNotFoundException) {
            Log.e(TAG, "Failed to get application info", e)
        }
    }

    private fun handleNotification(pushModel: PushPayloadParser?, message: RemoteMessage) {
        Thread({
            try {
                Vibes.getInstance().handleNotification(getApplicationContext(), message.getData())
            } catch (e: Exception) {
                Log.e(TAG, "Error handling notification", e)
            }
        }).start()
    }

    fun createPushPayloadParser(map: Map<String?, String?>?): PushPayloadParser {
        return PushPayloadParser(map)
    }

    companion object {
        private val TAG: String = "VibesExpo"
    }
}