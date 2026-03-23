// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "SNF_iOS",
    platforms: [.iOS(.v26)],
    dependencies: [
        .package(path: "../SNFKit"),
    ],
    targets: [
        .executableTarget(
            name: "SNF_iOS",
            dependencies: [
                .product(name: "SNFModels", package: "SNFKit"),
                .product(name: "SNFData", package: "SNFKit"),
                .product(name: "SNFServices", package: "SNFKit"),
            ],
            path: "Sources"
        ),
    ]
)
