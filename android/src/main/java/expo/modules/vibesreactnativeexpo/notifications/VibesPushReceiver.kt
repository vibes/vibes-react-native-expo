package expo.modules.vibesreactnativeexpo

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.vibes.vibes.PushPayloadParser
import com.vibes.vibes.VibesReceiver
import expo.modules.kotlin.Promise

class VibesPushReceiver : VibesReceiver() {
    @Override
    protected fun onPushOpened(context: Context?, pushModel: PushPayloadParser?) {
        super.onPushOpened(context, pushModel)
        Log.d(TAG, "Push message tapped. Emitting event")
        emitPayload(context, pushModel)
    }

    companion object {
        private val TAG: String = "VibesExpo"

        fun emitPayload(context: Context?, pushModel: PushPayloadParser?) {
            val handler: Handler = Handler(Looper.getMainLooper())
            handler.post({
                try {
                    val promise: Promise = Promise()
                    val pushEmitter: PushEvtEmitter = PushEvtEmitter(context)
                    pushEmitter.notifyPushOpened(pushModel, promise)
                    promise.then({ response -> Log.d(TAG, "Push event emitted successfully") })
                        .catchError({ error -> Log.e(TAG, "Error emitting push event", error) })
                } catch (e: Exception) {
                    Log.e(TAG, "Error in emitPayload", e)
                }
            })
        }
    }
}