package app.capgo.plugin.mux

import android.app.Activity
import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.PluginMethod

@CapacitorPlugin(name = "MuxPlayer")
class MuxPlayerPlugin : Plugin() {

    private val PLUGIN_VERSION = "7.1.1"

    companion object {
        internal var shared: MuxPlayerPlugin? = null
            private set
    }

    private var isActive: Boolean = false

    override fun load() {
        super.load()
        shared = this
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        if (shared === this) {
            shared = null
        }
    }

    @PluginMethod
    fun play(call: PluginCall) {
        val playbackId = call.getString("playbackId")
        if (playbackId.isNullOrEmpty()) {
            call.reject("playbackId is required")
            return
        }

        val hostActivity: Activity? = activity ?: bridge?.activity
        if (hostActivity == null) {
            call.reject("Unable to resolve a hosting Activity for playback")
            return
        }

        val intent = Intent(hostActivity, MuxPlayerActivity::class.java).apply {
            putExtra(MuxPlayerActivity.EXTRA_PLAYBACK_ID, playbackId)
            putExtra(MuxPlayerActivity.EXTRA_PLAYBACK_TOKEN, call.getString("playbackToken"))
            putExtra(MuxPlayerActivity.EXTRA_DRM_TOKEN, call.getString("drmToken"))
            putExtra(MuxPlayerActivity.EXTRA_CUSTOM_DOMAIN, call.getString("customDomain"))
            putExtra(MuxPlayerActivity.EXTRA_ENVIRONMENT_KEY, call.getString("environmentKey"))
            putExtra(MuxPlayerActivity.EXTRA_PLAYER_NAME, call.getString("playerName"))
            putExtra(MuxPlayerActivity.EXTRA_TITLE, call.getString("title"))
            putExtra(MuxPlayerActivity.EXTRA_SUBTITLE, call.getString("subtitle"))
            putExtra(MuxPlayerActivity.EXTRA_AUTO_PLAY, call.getBoolean("autoPlay", true))
            putExtra(MuxPlayerActivity.EXTRA_MUTED, call.getBoolean("muted") ?: false)
            putExtra(MuxPlayerActivity.EXTRA_START_TIME, call.getDouble("startTime") ?: Double.NaN)
            putExtra(MuxPlayerActivity.EXTRA_ENABLE_SMART_CACHE, call.getBoolean("enableSmartCache") ?: false)
            putExtra(MuxPlayerActivity.EXTRA_DEBUG, call.getBoolean("debug") ?: false)
        }

        hostActivity.startActivity(intent)
        isActive = true
        call.resolve()
    }

    @PluginMethod
    fun dismiss(call: PluginCall) {
        MuxPlayerActivity.finishActive()
        call.resolve()
    }

    @PluginMethod
    fun isActive(call: PluginCall) {
        val result = JSObject()
        result.put("active", isActive)
        call.resolve(result)
    }

    internal fun emit(event: String, data: JSObject = JSObject()) {
        notifyListeners(event, data)
    }

    internal fun onPlayerDismissed() {
        if (isActive) {
            isActive = false
            notifyListeners("playerDismissed", JSObject())
        }
    }

    @PluginMethod
    fun getPluginVersion(call: PluginCall) {
        try {
            val ret = JSObject()
            ret.put("version", PLUGIN_VERSION)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Could not get plugin version", e)
        }
    }
}
