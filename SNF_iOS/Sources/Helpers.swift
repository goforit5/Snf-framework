import SwiftUI
import SNFModels
import SNFServices

// All colors come from SNFKit/SNFModels/Theme.swift — single source of truth

// MARK: - Governance Badge

struct GovernanceBadge: View {
    let level: GovernanceLevel

    var body: some View {
        Text("L\(level.rawValue)")
            .font(.caption2.weight(.bold))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(level.badgeColor)
            .glassEffect(.regular, in: .capsule)
    }
}

// MARK: - Domain Badge

struct DomainBadge: View {
    let domain: Domain

    var body: some View {
        Label(domain.label, systemImage: domain.iconName)
            .font(.caption2.weight(.medium))
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .foregroundStyle(domain.color)
            .glassEffect(.regular, in: .capsule)
    }
}

// MARK: - Priority Badge

struct PriorityBadge: View {
    let priority: Priority

    var body: some View {
        Label(priority.rawValue, systemImage: priority.iconName)
            .font(.caption2.weight(.semibold))
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .foregroundStyle(priority.tintColor)
            .glassEffect(.regular, in: .capsule)
    }
}

// MARK: - Confidence Gauge

struct ConfidenceGauge: View {
    let confidence: Double

    private var color: Color {
        if confidence >= 0.95 { return .green }
        if confidence >= 0.80 { return .orange }
        return .red
    }

    var body: some View {
        Text("\(Int(confidence * 100))%")
            .font(.caption.weight(.bold).monospacedDigit())
            .foregroundStyle(color)
    }
}
