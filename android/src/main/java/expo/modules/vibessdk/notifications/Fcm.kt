package expo.modules.vibessdk

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.vibes.vibes.*

class Fms : FirebaseMessagingService() {
    private var prefs: SharedPreferences? = null

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("VibesPrefs", Context.MODE_PRIVATE)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d("VibesReactNativeExpo", "Push received: ${remoteMessage.data}")
        
        try {
            // Handle the push notification with Vibes SDK
            Vibes.getInstance().handleNotification(this, remoteMessage.data)
        } catch (e: Exception) {
            Log.e("VibesReactNativeExpo", "Error handling push message", e)
            // Fallback: show basic notification
            showNotification(remoteMessage)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        prefs?.edit()?.putString("Vibes.PushToken", token)?.apply()
        
        try {
            // Register the new token with Vibes
            Vibes.getInstance().registerPush(token, object : VibesListener<Void> {
                override fun onSuccess(unused: Void?) {
                    Log.d("VibesReactNativeExpo", "Token registered successfully")
                }
                
                override fun onFailure(errorText: String) {
                    Log.e("VibesReactNativeExpo", "Token registration failed: $errorText")
                }
            })
        } catch (e: Exception) {
            Log.e("VibesReactNativeExpo", "Error registering token", e)
        }
    }

    private fun showNotification(remoteMessage: RemoteMessage) {
        val channelId = "vibes_push_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Vibes Push Notifications",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        val intent = packageManager.getLaunchIntentForPackage(packageName ?: "")
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = remoteMessage.data["title"] ?: "Notification"
        val body = remoteMessage.data["body"] ?: ""

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    companion object {
        private const val TAG = "VibesExpo"
    }
}