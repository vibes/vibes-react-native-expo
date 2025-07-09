package expo.modules.vibessdk

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.vibes.vibes.PushPayloadParser
import com.vibes.vibes.VibesReceiver
import expo.modules.kotlin.Promise

class VibesPushReceiver : VibesReceiver() {
    
    override fun onPushOpened(context: Context?, pushModel: PushPayloadParser?) {
        super.onPushOpened(context, pushModel)
        Log.d(TAG, "Push message tapped. Emitting event")
        emitPayload(context, pushModel)
    }

    private fun emitPayload(context: Context?, pushModel: PushPayloadParser?) {
        Handler(Looper.getMainLooper()).post {
            try {
                if (context != null && pushModel != null) {
                    // Handle the push payload
                    Log.d(TAG, "Processing push payload: $pushModel")
                } else {
                    Log.w(TAG, "Context or pushModel is null")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing push payload", e)
            }
        }
    }

    companion object {
        private const val TAG = "VibesPushReceiver"
    }
} 