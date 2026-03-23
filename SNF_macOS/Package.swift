// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "SNF_macOS",
    platforms: [.macOS(.v26)],
    dependencies: [
        .package(path: "../SNFKit"),
    ],
    targets: [
        .executableTarget(
            name: "SNF_macOS",
            dependencies: [
                .product(name: "SNFModels", package: "SNFKit"),
                .product(name: "SNFData", package: "SNFKit"),
                .product(name: "SNFServices", package: "SNFKit"),
            ],
            path: "Sources"
        ),
    ]
)
