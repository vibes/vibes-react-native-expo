package expo.modules.vibesreactnativeexpo

import android.app.Application;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import expo.modules.kotlin.modules.Module;
import expo.modules.kotlin.modules.ModuleDefinition;
import expo.modules.kotlin.Promise;
import expo.modules.kotlin.records.Field;
import expo.modules.kotlin.records.Record;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.messaging.FirebaseMessaging;
import java.net.URL
import com.vibes.vibes.*;

class VibesReactNativeExpoModule : Module() {
  private val TAG = "VibesReactNativeExpo"
  private lateinit var appHelper: VibesAppHelper

  override fun definition() = ModuleDefinition {
    Name("VibesReactNativeExpo")

    Events("onChange")

    AsyncFunction("setValueAsync") { value: String ->
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    AsyncFunction("registerDevice") { promise: Promise ->
      registerDevice(promise)
    }

    AsyncFunction("registerPush") { promise: Promise ->
      registerPush(promise)
    }

    AsyncFunction("unregisterDevice") { promise: Promise ->
      unregisterDevice(promise)
    }

    AsyncFunction("getVibesDeviceInfo") { promise: Promise ->
      getVibesDeviceInfo(promise)
    }
  }

  override fun onCreate() {
    val application = appContext.reactContext?.applicationContext as? Application ?: return
    appHelper = VibesAppHelper(application)
    initializeVibes()
  }

  private fun initializeVibes() {
    Log.d(TAG, "Initializing Vibes SDK")
    try {
      val ai: ApplicationInfo = appContext.reactContext?.packageManager?.getApplicationInfo(
        appContext.reactContext?.packageName ?: "", PackageManager.GET_META_DATA
      ) ?: return
      val bundle: Bundle = ai.metaData
      val appId: String? = bundle.getString("com.vibes.push.rn.plugin.appId")
      val apiUrl: String? = bundle.getString("com.vibes.push.rn.plugin.apiUrl")

      if (appId.isNullOrEmpty()) {
        throw IllegalStateException("No appId provided in manifest")
      }

      val config = if (apiUrl.isNullOrEmpty()) {
        VibesConfig.Builder().setAppId(appId).build()
      } else {
        VibesConfig.Builder().setApiUrl(apiUrl).setAppId(appId).build()
      }

      Vibes.initialize(appContext.reactContext, config)
    } catch (ex: PackageManager.NameNotFoundException) {
      Log.e(TAG, "Error retrieving metadata", ex)
    }
  }

  private fun registerDevice(promise: Promise) {
    Log.d(TAG, "Registering device...")
    Vibes.getInstance().registerDevice(object : VibesListener<Credential> {
      override fun onSuccess(credential: Credential) {
        Log.d(TAG, "Device registered: ${credential.deviceID}")
        promise.resolve(credential.deviceID)
      }

      override fun onFailure(errorText: String) {
        Log.e(TAG, "Device registration failed: $errorText")
        promise.reject(errorText)
      }
    })
  }

  private fun registerPush(promise: Promise) {
    Log.d(TAG, "Fetching Firebase push token...")
    FirebaseMessaging.getInstance().token
      .addOnSuccessListener { token ->
        Log.d(TAG, "Push token: $token")
        appHelper.saveString("Vibes.PushToken", token)
        Vibes.getInstance().registerPush(token, object : VibesListener<Void> {
          override fun onSuccess(unused: Void?) {
            promise.resolve("Push token registered")
          }

          override fun onFailure(errorText: String) {
            promise.reject(errorText)
          }
        })
      }
      .addOnFailureListener { e ->
        Log.e(TAG, "Failed to fetch Firebase token", e)
        promise.reject("Failed to get push token")
      }
  }

  private fun unregisterDevice(promise: Promise) {
    Log.d(TAG, "Unregistering device...")
    Vibes.getInstance().unregisterDevice(object : VibesListener<Void> {
      override fun onSuccess(unused: Void?) {
        promise.resolve("Device unregistered")
      }

      override fun onFailure(errorText: String) {
        promise.reject(errorText)
      }
    })
  }

  private fun getVibesDeviceInfo(promise: Promise) {
    Log.d(TAG, "Fetching device info...")
    promise.resolve(appHelper.deviceInfo)
  }
}
