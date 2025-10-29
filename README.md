# @capgo/capacitor-mux-player
 <a href="https://capgo.app/"><img src='https://raw.githubusercontent.com/Cap-go/capgo/main/assets/capgo_banner.png' alt='Capgo - Instant updates for capacitor'/></a>

<div align="center">
  <h2><a href="https://capgo.app/?ref=plugin_mux_player"> ➡️ Get Instant updates for your App with Capgo</a></h2>
  <h2><a href="https://capgo.app/consulting/?ref=plugin_mux_player"> Missing a feature? We’ll build the plugin for you 💪</a></h2>
</div>
Naitve Mux Player SDK to play video on IOS and Android

## Documentation

The most complete doc is available here: https://capgo.app/docs/plugins/mux-player/

## Install

```bash
npm install @capgo/capacitor-mux-player
npx cap sync
```

### iOS setup

- Requires iOS 15 or newer.
- Add the Swift package `https://github.com/muxinc/mux-player-swift` to your Xcode workspace so that the `MuxPlayerSwift` module is available at build time.
- If you manage native dependencies through CocoaPods, prefer integrating this plugin via Swift Package Manager or add the Mux package manually to your app target.

### Android setup

- Gradle pulls the player from the Mux artifactory (`https://muxinc.jfrog.io/artifactory/default-maven-release-local`). Ensure your corporate proxy allows downloads from that host.
- The plugin depends on Kotlin 1.9 and Media3 1.1.x through the Mux artifact. No additional configuration is required in the consuming app.

### Web setup

- The plugin bundles `@mux/mux-player` and renders the video in a fullscreen overlay. The player automatically injects a close affordance for desktop and mobile browsers.

## API

<docgen-index>

* [`play(...)`](#play)
* [`dismiss()`](#dismiss)
* [`isActive()`](#isactive)
* [`removeAllListeners()`](#removealllisteners)
* [`addListener(E, ...)`](#addlistenere-)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### play(...)

```typescript
play(options: MuxPlayOptions) => Promise<void>
```

Launch the native Mux Player in fullscreen and begin playback.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#muxplayoptions">MuxPlayOptions</a></code> |

--------------------


### dismiss()

```typescript
dismiss() => Promise<void>
```

Dismiss the player if it is visible.

--------------------


### isActive()

```typescript
isActive() => Promise<{ active: boolean; }>
```

Returns whether the player is currently being displayed.

**Returns:** <code>Promise&lt;{ active: boolean; }&gt;</code>

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

Remove all event listeners registered on the plugin instance.

--------------------


### addListener(E, ...)

```typescript
addListener<E extends keyof MuxPlayerEvents>(eventName: E, listenerFunc: (event: MuxPlayerEvents[E]) => void) => Promise<PluginListenerHandle>
```

Listen to player lifecycle or playback events emitted by the plugin.

| Param              | Type                                                |
| ------------------ | --------------------------------------------------- |
| **`eventName`**    | <code>E</code>                                      |
| **`listenerFunc`** | <code>(event: MuxPlayerEvents[E]) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

--------------------


### Interfaces


#### MuxPlayOptions

| Prop                   | Type                 | Description                                                                          |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| **`playbackId`**       | <code>string</code>  | The playback ID of the asset you want to stream.                                     |
| **`playbackToken`**    | <code>string</code>  | Provide a JSON web token generated for signed playback policies.                     |
| **`drmToken`**         | <code>string</code>  | Provide a JSON web token generated for DRM playback policies.                        |
| **`customDomain`**     | <code>string</code>  | Override the default Mux playback domain (e.g. `stream.example.com`).                |
| **`autoPlay`**         | <code>boolean</code> | Auto-play when the player becomes visible. Defaults to true.                         |
| **`startTime`**        | <code>number</code>  | Start playback from the provided time (in seconds).                                  |
| **`poster`**           | <code>string</code>  | Provide a poster image URL to display before playback begins.                        |
| **`title`**            | <code>string</code>  | Provide a custom title to surface in native player chrome when available.            |
| **`subtitle`**         | <code>string</code>  | Provide a subtitle or description to surface in native player chrome when available. |
| **`muted`**            | <code>boolean</code> | Set to true to keep the video muted when playback starts.                            |
| **`environmentKey`**   | <code>string</code>  | Mux Data environment key used for analytics. If omitted, the SDK default is used.    |
| **`playerName`**       | <code>string</code>  | Provide an explicit player name for analytics. Defaults to a generated name.         |
| **`enableSmartCache`** | <code>boolean</code> | Enable smart caching when the underlying SDK supports it.                            |
| **`debug`**            | <code>boolean</code> | Enable verbose logging in native SDKs where available.                               |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### MuxPlayerEvents

| Prop                  | Type                                  | Description                                                  |
| --------------------- | ------------------------------------- | ------------------------------------------------------------ |
| **`ready`**           | <code>{ playerName?: string; }</code> | Fired when the underlying player is ready to begin playback. |
| **`play`**            | <code>void</code>                     | Fired when playback starts or resumes.                       |
| **`pause`**           | <code>void</code>                     | Fired when playback pauses.                                  |
| **`ended`**           | <code>void</code>                     | Fired when playback ends.                                    |
| **`error`**           | <code>{ message: string; }</code>     | Fired when an unrecoverable error occurs.                    |
| **`playerDismissed`** | <code>void</code>                     | Fired when the fullscreen player is closed.                  |

| Method               | Signature                                    | Description                             |
| -------------------- | -------------------------------------------- | --------------------------------------- |
| **getPluginVersion** | () =&gt; Promise&lt;{ version: string; }&gt; | Get the native Capacitor plugin version |

</docgen-api>
