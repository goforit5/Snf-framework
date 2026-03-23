import Foundation

// MARK: - Decision Status

public enum DecisionStatus: String, Codable, Sendable, CaseIterable {
    case pending
    case approved
    case overridden
    case escalated
    case deferred
}

// MARK: - Priority

public enum Priority: String, Codable, Sendable, CaseIterable, Comparable {
    case critical = "Critical"
    case high = "High"
    case medium = "Medium"
    case low = "Low"

    private var sortOrder: Int {
        switch self {
        case .critical: 0
        case .high: 1
        case .medium: 2
        case .low: 3
        }
    }

    public static func < (lhs: Priority, rhs: Priority) -> Bool {
        lhs.sortOrder < rhs.sortOrder
    }
}

// MARK: - Governance Level

public enum GovernanceLevel: Int, Codable, Sendable, CaseIterable, Comparable {
    case autonomous = 0
    case notify = 1
    case confirm = 2
    case review = 3
    case dualApprove = 4
    case executive = 5

    public var label: String {
        switch self {
        case .autonomous: "Autonomous"
        case .notify: "Auto + Notify"
        case .confirm: "Recommend + Confirm"
        case .review: "Human Review"
        case .dualApprove: "Multi-Party"
        case .executive: "Executive Only"
        }
    }

    public static func < (lhs: GovernanceLevel, rhs: GovernanceLevel) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

// MARK: - Domain

public enum Domain: String, Codable, Sendable, CaseIterable {
    case clinical
    case financial
    case workforce
    case operations
    case admissions
    case quality
    case legal
    case strategic
    case vendor
    case compliance
    case risk
    case revenueCycle = "revenue-cycle"
    case legalStrategic = "legal-strategic"
    case qualityCompliance = "quality-compliance"
    case orchestration
    case meta

    public var label: String {
        switch self {
        case .revenueCycle: "Revenue Cycle"
        case .legalStrategic: "Legal & Strategic"
        case .qualityCompliance: "Quality & Compliance"
        default: rawValue.capitalized
        }
    }

    public var colorHex: String {
        switch self {
        case .clinical: "#EF4444"
        case .financial: "#F59E0B"
        case .workforce: "#8B5CF6"
        case .operations: "#06B6D4"
        case .admissions: "#10B981"
        case .quality: "#3B82F6"
        case .legal: "#6366F1"
        case .strategic: "#EC4899"
        case .vendor: "#F97316"
        case .compliance: "#14B8A6"
        case .risk: "#DC2626"
        case .revenueCycle: "#F59E0B"
        case .legalStrategic: "#6366F1"
        case .qualityCompliance: "#3B82F6"
        case .orchestration: "#64748B"
        case .meta: "#94A3B8"
        }
    }
}

// MARK: - Scope

public enum ScopeType: Sendable, Equatable {
    case enterprise
    case region(String)
    case facility(String)
}

// MARK: - Survey Risk

public enum SurveyRisk: String, Codable, Sendable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
}

// MARK: - Actor Type

public enum ActorType: String, Codable, Sendable {
    case agent
    case human
}
