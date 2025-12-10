// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapgoCapacitorMuxPlayer",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapgoCapacitorMuxPlayer",
            targets: ["MuxPlayerPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/muxinc/mux-player-swift", from: "1.3.0")
    ],
    targets: [
        .target(
            name: "MuxPlayerPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "MuxPlayerSwift", package: "mux-player-swift")
            ],
            path: "ios/Sources/MuxPlayerPlugin"),
        .testTarget(
            name: "MuxPlayerPluginTests",
            dependencies: ["MuxPlayerPlugin"],
            path: "ios/Tests/MuxPlayerPluginTests")
    ]
)
