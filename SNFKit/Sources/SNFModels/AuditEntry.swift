import Foundation

public struct AuditEntry: Identifiable, Codable, Sendable {
    public let id: String
    public let traceId: String
    public let timestamp: String
    public let agentId: String?
    public let actorName: String
    public let actorType: ActorType
    public let action: String
    public let target: String
    public let targetType: String
    public let confidence: Double?
    public let policiesChecked: [String]
    public let evidence: [String]
    public let disposition: String
    public let facilityId: String
    public let parentId: String?
    public let governanceLevel: Int
}
