import Foundation

public struct Agent: Identifiable, Codable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let displayName: String
    public let domain: Domain
    public let description: String
    public let status: String
    public let lastRun: String
    public let actionsToday: Int
    public let exceptionsToday: Int
    public let confidenceAvg: Double
    public let policiesEnforced: [String]
    public let triggers: [String]
    public let governanceLevel: GovernanceLevel
    public let icon: String
    public let color: String

    public var isActive: Bool { status == "active" }
}
