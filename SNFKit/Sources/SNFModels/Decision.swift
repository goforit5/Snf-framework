import Foundation

public struct Decision: Identifiable, Codable, Sendable, Hashable {
    public let id: String
    public let title: String
    public let description: String
    public let domain: Domain
    public let priority: Priority
    public let governanceLevel: GovernanceLevel
    public let agentId: String
    public let agentRecommendation: String
    public let confidence: Double
    public let evidence: [String]
    public let policiesChecked: [String]
    public let facilityId: String
    public let residentId: String?
    public let staffId: String?
    public let vendorId: String?
    public let createdAt: Date
    public let dueBy: Date
    public var status: DecisionStatus
    public let estimatedImpact: String

    enum CodingKeys: String, CodingKey {
        case id, title, description, domain, priority, governanceLevel
        case agentId, agentRecommendation, confidence, evidence, policiesChecked
        case facilityId, residentId, staffId, vendorId
        case createdAt, dueBy, status, estimatedImpact
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        description = try c.decode(String.self, forKey: .description)
        domain = try c.decode(Domain.self, forKey: .domain)
        priority = try c.decode(Priority.self, forKey: .priority)
        governanceLevel = try c.decode(GovernanceLevel.self, forKey: .governanceLevel)
        agentId = try c.decode(String.self, forKey: .agentId)
        agentRecommendation = try c.decode(String.self, forKey: .agentRecommendation)
        confidence = try c.decode(Double.self, forKey: .confidence)
        evidence = try c.decode([String].self, forKey: .evidence)
        policiesChecked = try c.decode([String].self, forKey: .policiesChecked)
        facilityId = try c.decode(String.self, forKey: .facilityId)
        residentId = try c.decodeIfPresent(String.self, forKey: .residentId)
        staffId = try c.decodeIfPresent(String.self, forKey: .staffId)
        vendorId = try c.decodeIfPresent(String.self, forKey: .vendorId)
        status = try c.decode(DecisionStatus.self, forKey: .status)
        estimatedImpact = try c.decode(String.self, forKey: .estimatedImpact)

        let formatter = ISO8601DateFormatter()
        let createdAtStr = try c.decode(String.self, forKey: .createdAt)
        let dueByStr = try c.decode(String.self, forKey: .dueBy)
        createdAt = formatter.date(from: createdAtStr) ?? Date()
        dueBy = formatter.date(from: dueByStr) ?? Date()
    }
}
