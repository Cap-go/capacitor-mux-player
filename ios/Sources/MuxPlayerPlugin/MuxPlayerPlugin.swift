import AVFoundation
import AVKit
import Capacitor
#if canImport(MuxPlayerSwift)
import MuxPlayerSwift
#endif

#if canImport(MuxPlayerSwift)

@objc(MuxPlayerPlugin)
public class MuxPlayerPlugin: CAPPlugin, CAPBridgedPlugin, UIAdaptivePresentationControllerDelegate {
    private let pluginVersion: String = "8.0.5"
    public let identifier = "MuxPlayerPlugin"
    public let jsName = "MuxPlayer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isActive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    private var playerController: AVPlayerViewController?
    private var timeControlObservation: NSKeyValueObservation?
    private var itemStatusObservation: NSKeyValueObservation?
    private var playbackEndObserver: NSObjectProtocol?
    private var playbackErrorObserver: NSObjectProtocol?
    private var lastTimeControlStatus: AVPlayer.TimeControlStatus?
    private var lastMonitoringOptions: MonitoringOptions?

    @objc public func play(_ call: CAPPluginCall) {
        guard let playbackId = call.getString("playbackId"), !playbackId.isEmpty else {
            call.reject("playbackId is required")
            return
        }

        let playbackToken = call.getString("playbackToken")
        let drmToken = call.getString("drmToken")
        let customDomain = call.getString("customDomain")
        let autoPlay = call.getBool("autoPlay", true)
        let muted = call.getBool("muted") ?? false
        let startTime = call.getDouble("startTime")
        let environmentKey = call.getString("environmentKey")
        let playerName = call.getString("playerName")
        let enableSmartCache = call.getBool("enableSmartCache") ?? false
        let debug = call.getBool("debug") ?? false
        let title = call.getString("title")
        let subtitle = call.getString("subtitle")

        DispatchQueue.main.async {
            self.presentPlayer(
                playbackId: playbackId,
                playbackToken: playbackToken,
                drmToken: drmToken,
                customDomain: customDomain,
                environmentKey: environmentKey,
                preferredPlayerName: playerName,
                autoPlay: autoPlay,
                muted: muted,
                startTime: startTime,
                enableSmartCache: enableSmartCache,
                title: title,
                subtitle: subtitle,
                debug: debug
            )
            call.resolve()
        }
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.pluginVersion])
    }

    @objc public func dismiss(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let controller = self.playerController else {
                call.resolve()
                return
            }

            controller.dismiss(animated: true) {
                self.handleDismissal()
                call.resolve()
            }
        }
    }

    @objc public func isActive(_ call: CAPPluginCall) {
        let active = playerController != nil
        call.resolve(["active": active])
    }

    public func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        handleDismissal()
    }

    private func presentPlayer(
        playbackId: String,
        playbackToken: String?,
        drmToken: String?,
        customDomain: String?,
        environmentKey: String?,
        preferredPlayerName: String?,
        autoPlay: Bool,
        muted: Bool,
        startTime: Double?,
        enableSmartCache: Bool,
        title: String?,
        subtitle: String?,
        debug: Bool
    ) {
        if let existing = playerController {
            existing.dismiss(animated: false)
        }

        cleanUpObservers()

        let playbackOptions = buildPlaybackOptions(
            playbackToken: playbackToken,
            drmToken: drmToken,
            customDomain: customDomain,
            enableSmartCache: enableSmartCache
        )

        var monitoringOptions = buildMonitoringOptions(
            playbackId: playbackId,
            environmentKey: environmentKey,
            preferredPlayerName: preferredPlayerName
        )
        monitoringOptions.automaticErrorTracking = true

        let controller = AVPlayerViewController(
            playbackID: playbackId,
            playbackOptions: playbackOptions,
            monitoringOptions: monitoringOptions
        )

        controller.modalPresentationStyle = .fullScreen
        controller.presentationController?.delegate = self

        if let title {
            controller.title = title
        }

        if title != nil || subtitle != nil {
            attachMetadata(to: controller, title: title, subtitle: subtitle)
        }

        if let player = controller.player {
            player.isMuted = muted
            if let start = startTime, start >= 0 {
                let time = CMTime(seconds: start, preferredTimescale: 600)
                player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
            }

            attachObservers(to: player, monitoringOptions: monitoringOptions)
        }

        lastMonitoringOptions = monitoringOptions
        playerController = controller

        guard let bridgeController = bridge?.viewController else {
            controller.player?.pause()
            return
        }

        bridgeController.present(controller, animated: true) {
            if autoPlay {
                controller.player?.play()
            }
        }
    }

    private func handleDismissal() {
        guard playerController != nil else { return }
        cleanUpObservers()
        playerController = nil
        lastMonitoringOptions = nil
        notifyListeners("playerDismissed", data: [:])
    }

    private func buildPlaybackOptions(
        playbackToken: String?,
        drmToken: String?,
        customDomain: String?,
        enableSmartCache: Bool
    ) -> PlaybackOptions {
        var options: PlaybackOptions

        if let playbackToken, let drmToken {
            options = PlaybackOptions(
                playbackToken: playbackToken,
                drmToken: drmToken,
                customDomain: customDomain
            )
        } else if let playbackToken {
            if let customDomain {
                options = PlaybackOptions(customDomain: customDomain, playbackToken: playbackToken)
            } else {
                options = PlaybackOptions(playbackToken: playbackToken)
            }
        } else if let customDomain {
            options = PlaybackOptions(customDomain: customDomain)
        } else {
            options = PlaybackOptions()
        }

        if enableSmartCache {
            let logMessage = "Mux smart cache requires specific playback configuration; ignoring enableSmartCache for now."
            NSLog(logMessage)
        }

        return options
    }

    private func buildMonitoringOptions(
        playbackId: String,
        environmentKey: String?,
        preferredPlayerName: String?
    ) -> MonitoringOptions {
        let automaticName = preferredPlayerName ?? "MuxPlayer-\(UUID().uuidString.prefix(8))"

        if let environmentKey {
            return MonitoringOptions(environmentKey: environmentKey, playerName: automaticName)
        }

        var options = MonitoringOptions(playbackID: playbackId)
        options.playerName = automaticName
        return options
    }

    private func attachObservers(to player: AVPlayer, monitoringOptions: MonitoringOptions) {
        lastTimeControlStatus = player.timeControlStatus

        timeControlObservation = player.observe(\.timeControlStatus, options: [.initial, .new]) { [weak self] player, _ in
            guard let self else { return }
            guard self.lastTimeControlStatus != player.timeControlStatus else { return }

            self.lastTimeControlStatus = player.timeControlStatus

            switch player.timeControlStatus {
            case .playing:
                self.notifyListeners("play", data: [:])
            case .paused:
                self.notifyListeners("pause", data: [:])
            default:
                break
            }
        }

        if let item = player.currentItem {
            itemStatusObservation = item.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
                guard let self else { return }
                if item.status == .readyToPlay {
                    self.notifyListeners(
                        "ready",
                        data: [
                            "playerName": self.lastMonitoringOptions?.playerName ?? monitoringOptions.playerName
                        ]
                    )
                    self.itemStatusObservation = nil
                }
            }

            playbackEndObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: item,
                queue: .main
            ) { [weak self] _ in
                self?.notifyListeners("ended", data: [:])
            }

            playbackErrorObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemFailedToPlayToEndTime,
                object: item,
                queue: .main
            ) { [weak self] notification in
                let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? NSError
                let message = error?.localizedDescription ?? "Mux player encountered an error."
                self?.notifyListeners("error", data: ["message": message])
            }
        }
    }

    private func attachMetadata(
        to controller: AVPlayerViewController,
        title: String?,
        subtitle: String?
    ) {
        guard let item = controller.player?.currentItem else {
            return
        }

        var metadataItems: [AVMetadataItem] = []

        if let title {
            let titleMetadata = AVMutableMetadataItem()
            titleMetadata.locale = Locale.current
            titleMetadata.identifier = .commonIdentifierTitle
            titleMetadata.value = title as NSString
            metadataItems.append(titleMetadata)
        }

        if let subtitle {
            let subtitleMetadata = AVMutableMetadataItem()
            subtitleMetadata.locale = Locale.current
            subtitleMetadata.identifier = .commonIdentifierDescription
            subtitleMetadata.value = subtitle as NSString
            metadataItems.append(subtitleMetadata)
        }

        item.externalMetadata = metadataItems
    }

    private func cleanUpObservers() {
        if let playbackEndObserver {
            NotificationCenter.default.removeObserver(playbackEndObserver)
            self.playbackEndObserver = nil
        }
        if let playbackErrorObserver {
            NotificationCenter.default.removeObserver(playbackErrorObserver)
            self.playbackErrorObserver = nil
        }
        timeControlObservation = nil
        itemStatusObservation = nil
        lastTimeControlStatus = nil
    }
}

#else

@objc(MuxPlayerPlugin)
public class MuxPlayerPlugin: CAPPlugin, CAPBridgedPlugin {
    private let pluginVersion: String = "8.0.5"
    public let identifier = "MuxPlayerPlugin"
    public let jsName = "MuxPlayer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isActive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    @objc public func play(_ call: CAPPluginCall) {
        call.reject("MuxPlayerSwift is not available. Add the Swift package https://github.com/muxinc/mux-player-swift to your iOS project.")
    }

    @objc public func dismiss(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc public func isActive(_ call: CAPPluginCall) {
        call.resolve(["active": false])
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.pluginVersion])
    }

}

#endif
