// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapgoCapacitorMuxPlayer",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapgoCapacitorMuxPlayer",
            targets: ["MuxPlayerPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "MuxPlayerPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/MuxPlayerPlugin"),
        .testTarget(
            name: "MuxPlayerPluginTests",
            dependencies: ["MuxPlayerPlugin"],
            path: "ios/Tests/MuxPlayerPluginTests")
    ]
)
