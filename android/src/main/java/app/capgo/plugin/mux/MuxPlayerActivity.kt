package app.capgo.plugin.mux

import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.ui.PlayerView
import com.getcapacitor.JSObject
import com.mux.player.MuxPlayer
import com.mux.player.media.MediaItems
import java.lang.ref.WeakReference

class MuxPlayerActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_PLAYBACK_ID = "playbackId"
        const val EXTRA_PLAYBACK_TOKEN = "playbackToken"
        const val EXTRA_DRM_TOKEN = "drmToken"
        const val EXTRA_CUSTOM_DOMAIN = "customDomain"
        const val EXTRA_ENVIRONMENT_KEY = "environmentKey"
        const val EXTRA_PLAYER_NAME = "playerName"
        const val EXTRA_TITLE = "title"
        const val EXTRA_SUBTITLE = "subtitle"
        const val EXTRA_AUTO_PLAY = "autoPlay"
        const val EXTRA_MUTED = "muted"
        const val EXTRA_START_TIME = "startTime"
        const val EXTRA_ENABLE_SMART_CACHE = "enableSmartCache"
        const val EXTRA_DEBUG = "debug"

        private var activeActivity: WeakReference<MuxPlayerActivity>? = null

        fun finishActive() {
            activeActivity?.get()?.let { activity ->
                activity.finish()
            }
        }
    }

    private var player: MuxPlayer? = null
    private lateinit var playerView: PlayerView
    private var readyDispatched: Boolean = false
    private var preferredPlayerName: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        activeActivity = WeakReference(this)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )

        playerView = PlayerView(this).apply {
            setBackgroundColor(Color.BLACK)
            useController = true
        }
        setContentView(playerView)

        val playbackId = intent.getStringExtra(EXTRA_PLAYBACK_ID)
        if (playbackId.isNullOrEmpty()) {
            finish()
            return
        }

        val playbackToken = intent.getStringExtra(EXTRA_PLAYBACK_TOKEN)
        val customDomain = intent.getStringExtra(EXTRA_CUSTOM_DOMAIN)
        val envKey = intent.getStringExtra(EXTRA_ENVIRONMENT_KEY)
        val playerName = intent.getStringExtra(EXTRA_PLAYER_NAME)
        val title = intent.getStringExtra(EXTRA_TITLE)
        val subtitle = intent.getStringExtra(EXTRA_SUBTITLE)
        val autoPlay = intent.getBooleanExtra(EXTRA_AUTO_PLAY, true)
        val muted = intent.getBooleanExtra(EXTRA_MUTED, false)
        val startTime = intent.getDoubleExtra(EXTRA_START_TIME, Double.NaN)
        val enableSmartCache = intent.getBooleanExtra(EXTRA_ENABLE_SMART_CACHE, false)
        val debug = intent.getBooleanExtra(EXTRA_DEBUG, false)

        preferredPlayerName = playerName

        val builder = MuxPlayer.Builder(this)
        if (!envKey.isNullOrEmpty()) {
            builder.setMuxDataEnv(envKey)
        }
        if (enableSmartCache) {
            builder.enableSmartCache(true)
        }
        if (debug) {
            builder.enableLogcat(true)
        }

        val muxPlayer = builder.build()
        player = muxPlayer
        playerView.player = muxPlayer

        val mediaItemBuilder = MediaItems.builderFromMuxPlaybackId(
            playbackId,
            domain = customDomain,
            playbackToken = playbackToken
        )

        val metadataBuilder = MediaMetadata.Builder()
        if (!title.isNullOrEmpty()) {
            metadataBuilder.setTitle(title)
        }
        if (!subtitle.isNullOrEmpty()) {
            metadataBuilder.setDescription(subtitle)
        }
        mediaItemBuilder.setMediaMetadata(metadataBuilder.build())

        muxPlayer.setMediaItem(mediaItemBuilder.build())

        if (muted) {
            muxPlayer.volume = 0f
        }

        muxPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                when (playbackState) {
                    Player.STATE_READY -> {
                        if (!readyDispatched) {
                            readyDispatched = true
                            val payload = JSObject()
                            preferredPlayerName?.let { payload.put("playerName", it) }
                            MuxPlayerPlugin.shared?.emit("ready", payload)
                        }
                    }
                    Player.STATE_ENDED -> {
                        MuxPlayerPlugin.shared?.emit("ended", JSObject())
                    }
                }
            }

            override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
                if (playWhenReady) {
                    MuxPlayerPlugin.shared?.emit("play", JSObject())
                } else {
                    MuxPlayerPlugin.shared?.emit("pause", JSObject())
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                val payload = JSObject()
                payload.put("message", error.localizedMessage ?: "Mux player error")
                MuxPlayerPlugin.shared?.emit("error", payload)
            }
        })

        if (!startTime.isNaN()) {
            muxPlayer.seekTo((startTime * 1000).toLong())
        }

        muxPlayer.prepare()
        muxPlayer.playWhenReady = autoPlay
    }

    override fun onDestroy() {
        super.onDestroy()

        playerView.player = null
        player?.release()
        player = null

        if (activeActivity?.get() === this) {
            activeActivity = null
        }

        MuxPlayerPlugin.shared?.onPlayerDismissed()
    }

    override fun onBackPressed() {
        super.onBackPressed()
        finish()
    }
}
