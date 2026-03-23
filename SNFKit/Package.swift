// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "SNFKit",
    platforms: [
        .macOS(.v26),
        .iOS(.v26),
    ],
    products: [
        .library(name: "SNFModels", targets: ["SNFModels"]),
        .library(name: "SNFData", targets: ["SNFData"]),
        .library(name: "SNFServices", targets: ["SNFServices"]),
    ],
    targets: [
        .target(
            name: "SNFModels",
            path: "Sources/SNFModels"
        ),
        .target(
            name: "SNFData",
            dependencies: ["SNFModels"],
            path: "Sources/SNFData",
            resources: [.process("MockData")]
        ),
        .target(
            name: "SNFServices",
            dependencies: ["SNFModels", "SNFData"],
            path: "Sources/SNFServices"
        ),
        .testTarget(
            name: "SNFKitTests",
            dependencies: ["SNFModels", "SNFData", "SNFServices"],
            path: "Tests"
        ),
    ]
)
