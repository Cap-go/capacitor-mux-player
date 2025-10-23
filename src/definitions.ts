import type { PluginListenerHandle } from '@capacitor/core';

export type MuxPlaybackPolicy = 'public' | 'signed' | 'drm';

export interface MuxPlayOptions {
  /**
   * The playback ID of the asset you want to stream.
   */
  playbackId: string;
  /**
   * Provide a JSON web token generated for signed playback policies.
   */
  playbackToken?: string;
  /**
   * Provide a JSON web token generated for DRM playback policies.
   */
  drmToken?: string;
  /**
   * Override the default Mux playback domain (e.g. `stream.example.com`).
   */
  customDomain?: string;
  /**
   * Auto-play when the player becomes visible. Defaults to true.
   */
  autoPlay?: boolean;
  /**
   * Start playback from the provided time (in seconds).
   */
  startTime?: number;
  /**
   * Provide a poster image URL to display before playback begins.
   */
  poster?: string;
  /**
   * Provide a custom title to surface in native player chrome when available.
   */
  title?: string;
  /**
   * Provide a subtitle or description to surface in native player chrome when available.
   */
  subtitle?: string;
  /**
   * Set to true to keep the video muted when playback starts.
   */
  muted?: boolean;
  /**
   * Mux Data environment key used for analytics. If omitted, the SDK default is used.
   */
  environmentKey?: string;
  /**
   * Provide an explicit player name for analytics. Defaults to a generated name.
   */
  playerName?: string;
  /**
   * Enable smart caching when the underlying SDK supports it.
   */
  enableSmartCache?: boolean;
  /**
   * Enable verbose logging in native SDKs where available.
   */
  debug?: boolean;
}

export interface MuxPlayerPlugin {
  /**
   * Launch the native Mux Player in fullscreen and begin playback.
   */
  play(options: MuxPlayOptions): Promise<void>;
  /**
   * Dismiss the player if it is visible.
   */
  dismiss(): Promise<void>;
  /**
   * Returns whether the player is currently being displayed.
   */
  isActive(): Promise<{ active: boolean }>;
  /**
   * Remove all event listeners registered on the plugin instance.
   */
  removeAllListeners(): Promise<void>;
  /**
   * Listen to player lifecycle or playback events emitted by the plugin.
   */
  addListener<E extends keyof MuxPlayerEvents>(
    eventName: E,
    listenerFunc: (event: MuxPlayerEvents[E]) => void,
  ): Promise<PluginListenerHandle>;
}

export interface MuxPlayerEvents {
  /**
   * Fired when the underlying player is ready to begin playback.
   */
  ready: { playerName?: string };
  /**
   * Fired when playback starts or resumes.
   */
  play: void;
  /**
   * Fired when playback pauses.
   */
  pause: void;
  /**
   * Fired when playback ends.
   */
  ended: void;
  /**
   * Fired when an unrecoverable error occurs.
   */
  error: { message: string };
  /**
   * Fired when the fullscreen player is closed.
   */
  playerDismissed: void;

  /**
   * Get the native Capacitor plugin version
   *
   * @returns {Promise<{ id: string }>} an Promise with version for this device
   * @throws An error if the something went wrong
   */
  getPluginVersion(): Promise<{ version: string }>;
}
