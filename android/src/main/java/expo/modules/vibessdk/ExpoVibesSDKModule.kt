package expo.modules.vibessdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.ModuleDefinition
import com.vibes.vibes.*
import java.net.URL
import android.app.Application
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log

import com.google.firebase.messaging.FirebaseMessaging

class ExpoVibesSDKModule : Module() {
  companion object {
    private const val TAG = "ExpoVibesSDK"
  }
  
  private lateinit var appHelper: VibesAppHelper

  override fun definition() = ModuleDefinition {
    Name("ExpoVibesSDK")

    Constants {
      mapOf("SDKBuildVersion" to "0.3.16")
    }

    Events(
      "onChange",
      "onGetPerson",
      "onFetchInboxMessages", 
      "onFetchInboxMessage",
      "onMarkInboxMessageAsRead",
      "onExpireInboxMessage",
      "onInboxMessageOpenEvent",
      "onInboxMessagesFetchedEvent"
    )

    AsyncFunction("setValueAsync") { value: String ->
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    AsyncFunction("registerDevice") { promise: Promise ->
      Log.d(TAG, "Registering device...")
      
      Vibes.getInstance().registerDevice(object : VibesListener<Credential> {
        override fun onSuccess(credential: Credential) {
          Log.d(TAG, "Device registered: ${credential.deviceID}")
          appHelper.saveString("Vibes.DeviceId", credential.deviceID)
          promise.resolve(credential.deviceID)
        }
        override fun onFailure(errorText: String) {
          Log.e(TAG, "Device registration failed: $errorText")
          promise.reject("DEVICE_REGISTRATION_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("unregisterDevice") { promise: Promise ->
      Log.d(TAG, "Unregistering device...")
      Vibes.getInstance().unregisterDevice(object : VibesListener<Void> {
        override fun onSuccess(unused: Void?) {
          Log.d(TAG, "Device unregistered successfully")
          sendEvent("onDeviceUnregistered", mapOf(
            "success" to true,
            "message" to "Device unregistered"
          ))
          promise.resolve("Device unregistered successfully")
        }
        override fun onFailure(errorText: String) {
          Log.e(TAG, "Device unregistration failed: $errorText")
          sendEvent("onError", mapOf(
            "function" to "unregisterDevice",
            "error" to errorText,
            "code" to "DEVICE_UNREGISTRATION_ERROR"
          ))
          promise.reject("DEVICE_UNREGISTRATION_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("registerPush") { promise: Promise ->
      Log.d(TAG, "Registering push notifications...")
      
      try {
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
          Log.d(TAG, "Firebase token obtained: $token")
          
          Vibes.getInstance().registerPush(token, object : VibesListener<Void> {
            override fun onSuccess(unused: Void?) {
              Log.d(TAG, "Push registration successful")
              appHelper.saveString("Vibes.PushToken", token)
              promise.resolve("Push registration successful")
            }
            
            override fun onFailure(errorText: String) {
              Log.e(TAG, "Push registration failed: $errorText")
              promise.reject("PUSH_REGISTRATION_ERROR", errorText, null)
            }
          })
        }.addOnFailureListener { exception ->
          Log.e(TAG, "Failed to get Firebase token: ${exception.message}")
          promise.reject("FIREBASE_TOKEN_ERROR", "Failed to get Firebase token: ${exception.message}", exception)
        }
      } catch (e: Exception) {
        Log.e(TAG, "Error in registerPush: ${e.message}")
        promise.reject("PUSH_REGISTRATION_ERROR", "Error in registerPush: ${e.message}", e)
      }
    }

    AsyncFunction("unregisterPush") { promise: Promise ->
      Vibes.getInstance().unregisterPush(object : VibesListener<Void> {
        override fun onSuccess(unused: Void?) {
          Log.d(TAG, "Push unregistration successful")
          sendEvent("onPushUnregistered", mapOf(
            "success" to true,
            "message" to "Push unregistration successful"
          ))
          promise.resolve("Push unregistered successfully")
        }
        override fun onFailure(errorText: String) {
          Log.e(TAG, "Push unregistration failed: $errorText")
          sendEvent("onError", mapOf(
            "function" to "unregisterPush",
            "error" to errorText,
            "code" to "PUSH_UNREGISTRATION_ERROR"
          ))
          promise.reject("PUSH_UNREGISTRATION_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("associatePerson") { externalPersonId: String, promise: Promise ->
      Vibes.getInstance().associatePerson(externalPersonId, object : VibesListener<Void> {
        override fun onSuccess(unused: Void?) {
          Log.d(TAG, "Person associated successfully")
          promise.resolve("Person associated successfully")
        }
        override fun onFailure(errorText: String) {
          Log.e(TAG, "Person association failed: $errorText")
          promise.reject("PERSON_ASSOCIATION_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("updateDevice") { updateCredentials: Boolean, lat: Double, lon: Double, promise: Promise ->
      Vibes.getInstance().updateDevice(updateCredentials, lat, lon, object : VibesListener<Credential> {
        override fun onSuccess(credential: Credential) {
          Log.d(TAG, "Device updated successfully")
          appHelper.saveLatitude(lat)
          appHelper.saveLongitude(lon)
          promise.resolve("Device updated successfully")
        }
        override fun onFailure(errorText: String) {
          Log.e(TAG, "Device update failed: $errorText")
          promise.reject("DEVICE_UPDATE_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("getPerson") { promise: Promise ->
      Vibes.getInstance().getPerson(object : VibesListener<Person> {
        override fun onSuccess(person: Person) {
          sendEvent("onGetPerson", mapOf("person" to person.externalPersonId))
          promise.resolve(person.externalPersonId)
        }
        override fun onFailure(errorText: String) {
          promise.reject("GET_PERSON_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("fetchInboxMessages") { promise: Promise ->
      Vibes.getInstance().fetchInboxMessages(object : VibesListener<Collection<InboxMessage>> {
        override fun onSuccess(messages: Collection<InboxMessage>) {
          val messagesList = messages.map { message ->
            mapOf(
              "id" to message.messageUid,
              "title" to message.subject,
              "body" to message.content,
              "read" to (message.read ?: false),
              "mainImage" to message.mainIcon,
              "iconImage" to message.iconImage,
              "inboxCustomData" to message.inboxCustomData,
              "expired" to (message.expirationDate?.before(java.util.Date()) ?: false)
            )
          }
          sendEvent("onFetchInboxMessages", mapOf("messages" to messagesList))
          promise.resolve(messagesList)
        }
        override fun onFailure(errorText: String) {
          promise.reject("FETCH_INBOX_MESSAGES_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("fetchInboxMessage") { messageId: String, promise: Promise ->
      Vibes.getInstance().fetchInboxMessage(messageId, object : VibesListener<InboxMessage> {
        override fun onSuccess(message: InboxMessage) {
          val messageData = mapOf(
            "id" to message.messageUid,
            "title" to message.subject,
            "body" to message.content,
            "read" to (message.read ?: false),
            "mainImage" to message.mainIcon,
            "iconImage" to message.iconImage,
            "inboxCustomData" to message.inboxCustomData,
            "expired" to (message.expirationDate?.before(java.util.Date()) ?: false)
          )
          sendEvent("onFetchInboxMessage", mapOf("message" to messageData))
          promise.resolve(messageData)
        }
        override fun onFailure(errorText: String) {
          promise.reject("FETCH_INBOX_MESSAGE_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("markInboxMessageAsRead") { messageId: String, promise: Promise ->
      Vibes.getInstance().markInboxMessageAsRead(messageId, object : VibesListener<InboxMessage> {
        override fun onSuccess(message: InboxMessage) {
          sendEvent("onMarkInboxMessageAsRead", mapOf("messages" to 1))
          promise.resolve("Message marked as read")
        }
        override fun onFailure(errorText: String) {
          promise.reject("MARK_MESSAGE_AS_READ_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("expireInboxMessage") { messageId: String, promise: Promise ->
      Vibes.getInstance().expireInboxMessage(messageId, object : VibesListener<InboxMessage> {
        override fun onSuccess(message: InboxMessage) {
          sendEvent("onExpireInboxMessage", mapOf("messages" to 1))
          promise.resolve("Message expired")
        }
        override fun onFailure(errorText: String) {
          promise.reject("EXPIRE_MESSAGE_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("onInboxMessageOpen") { messageId: String, promise: Promise ->
      Vibes.getInstance().fetchInboxMessage(messageId, object : VibesListener<InboxMessage> {
        override fun onSuccess(message: InboxMessage) {
          Vibes.getInstance().onInboxMessageOpen(message)
          sendEvent("onInboxMessageOpenEvent", mapOf("message" to "Success"))
          promise.resolve("Message open tracked")
        }
        override fun onFailure(errorText: String) {
          promise.reject("INBOX_MESSAGE_OPEN_ERROR", errorText, null)
        }
      })
    }

    AsyncFunction("onInboxMessagesFetched") { promise: Promise ->
      Vibes.getInstance().onInboxMessagesFetched()
      sendEvent("onInboxMessagesFetchedEvent", mapOf("message" to "Success"))
      promise.resolve("Messages fetched event tracked")
    }

    AsyncFunction("getVibesDeviceInfo") { promise: Promise ->
      Log.d(TAG, "Fetching device info...")
      promise.resolve(appHelper.deviceInfo)
    }

    AsyncFunction("getSDKVersion") { promise: Promise ->
      promise.resolve("0.3.16")
    }

    AsyncFunction("initializeVibes") { promise: Promise ->
      initializeVibes()
      promise.resolve("Vibes SDK initialized")
    }

    OnCreate {
      val application = appContext.reactContext?.applicationContext as? Application ?: return@OnCreate
      appHelper = VibesAppHelper(application)
      initializeVibes()
    }
  }

  private fun initializeVibes() {
    Log.d(TAG, "Initializing Vibes SDK")
    try {
      val ai: ApplicationInfo = appContext.reactContext?.packageManager?.getApplicationInfo(
        appContext.reactContext?.packageName ?: "", PackageManager.GET_META_DATA
      ) ?: return
      val bundle: Bundle = ai.metaData
      val appId: String? = bundle.getString("vibes_app_id")
      val apiUrl: String? = bundle.getString("vibes_api_url")

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
  

}

