import SwiftUI
import SNFModels

// MARK: - Priority Colors

extension Priority {
    public var color: Color {
        switch self {
        case .critical: .red
        case .high: .orange
        case .medium: .yellow
        case .low: .green
        }
    }

    /// Accessible tint for text/icons — avoids raw yellow on white
    public var tintColor: Color {
        switch self {
        case .critical: .red
        case .high: .orange
        case .medium: .mint
        case .low: .green
        }
    }

    public var iconName: String {
        switch self {
        case .critical: "exclamationmark.octagon.fill"
        case .high: "exclamationmark.triangle.fill"
        case .medium: "arrow.right.circle.fill"
        case .low: "checkmark.circle.fill"
        }
    }
}

// MARK: - Governance Level Colors

extension GovernanceLevel {
    public var badgeColor: Color {
        switch self {
        case .autonomous, .notify: .green
        case .confirm, .review: .orange
        case .dualApprove, .executive: .red
        }
    }
}

// MARK: - Domain Colors

extension Domain {
    public var color: Color {
        switch self {
        case .clinical: .red
        case .financial, .revenueCycle: .orange
        case .workforce: .purple
        case .operations: .cyan
        case .admissions: .green
        case .quality, .qualityCompliance: .blue
        case .legal, .legalStrategic: .indigo
        case .strategic: .pink
        case .vendor: .orange
        case .compliance: .teal
        case .risk: .red
        case .orchestration: .gray
        case .meta: .secondary
        }
    }

    public var iconName: String {
        switch self {
        case .clinical: "heart.text.clipboard"
        case .financial: "dollarsign.circle"
        case .workforce: "person.3"
        case .operations: "gearshape.2"
        case .admissions: "person.badge.plus"
        case .quality: "star.circle"
        case .legal: "building.columns"
        case .strategic: "chart.line.uptrend.xyaxis"
        case .vendor: "shippingbox"
        case .compliance: "checkmark.shield"
        case .risk: "exclamationmark.shield"
        case .revenueCycle: "arrow.triangle.2.circlepath"
        case .legalStrategic: "scale.3d"
        case .qualityCompliance: "list.clipboard"
        case .orchestration: "cpu"
        case .meta: "ellipsis.circle"
        }
    }
}

// MARK: - Survey Risk Colors

extension SurveyRisk {
    public var color: Color {
        switch self {
        case .low: .green
        case .medium: .orange
        case .high: .red
        }
    }
}

// MARK: - Decision Status Colors

extension DecisionStatus {
    public var color: Color {
        switch self {
        case .pending: .blue
        case .approved: .green
        case .overridden: .orange
        case .escalated: .red
        case .deferred: .secondary
        }
    }
}

// MARK: - Health Score

public func healthScoreColor(_ score: Int) -> Color {
    if score >= 85 { return .green }
    if score >= 70 { return .orange }
    return .red
}
