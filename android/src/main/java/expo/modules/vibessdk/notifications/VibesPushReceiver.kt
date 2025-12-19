package expo.modules.vibessdk

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.vibes.vibes.VibesReceiver
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.vibes.vibes.PushPayloadParser
import com.vibes.vibes.Vibes

class VibesPushReceiver : VibesReceiver() {
    
    override fun onPushOpened(context: Context, pushModel: PushPayloadParser) {
        super.onPushOpened(context, pushModel)
        Log.d(TAG, "Push message tapped. Emitting event")
        emitPayload(context, pushModel)
    }

    companion object {
        private fun emitPayload(context: Context, pushModel: PushPayloadParser) {
            Log.d(TAG, "Vibes push payload found. Attempting to emit to Javascript");
            Vibes.getInstance().onPushMessageOpened(pushModel, context);
            val reactApp = context.applicationContext as ReactApplication
            val mReactInstanceManager = reactApp.reactNativeHost.reactInstanceManager
            val reactContext = mReactInstanceManager.currentReactContext
            if (reactContext != null) {
                Log.d(TAG, "Context exists")
                val emitter = PushEvtEmitter(reactContext)
                emitter.notifyPushOpened(pushModel)
            }
            else {
                Log.d(TAG, "Context is missing")
                mReactInstanceManager.addReactInstanceEventListener(object :
                    ReactInstanceManager.ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: ReactContext) {
                        Log.d(TAG, "Context initialized")
                        val emitter = PushEvtEmitter(context)
                        emitter.notifyPushOpened(pushModel)
                        mReactInstanceManager.removeReactInstanceEventListener(this)
                    }
                })
                if (!mReactInstanceManager.hasStartedCreatingInitialContext()) {
                    Log.d(TAG, "Initializing context")
                    mReactInstanceManager.createReactContextInBackground()
                }
            }
        }

        fun handlePushOpened(context: Context, intent: android.content.Intent) {
            Log.d(TAG, "Checking if Vibes push message exists in intent");
            val pushMap = intent.getSerializableExtra("vibesRemoteMessageData") as? HashMap<String, String>
            if (pushMap != null) {
                val pushModel = PushPayloadParser(pushMap)
                emitPayload(context, pushModel);
            } else {
                Log.d(TAG, "No push received");
            }
        }
        private const val TAG = "VibesPushReceiver"
    }
} 