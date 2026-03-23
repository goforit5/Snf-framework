import SwiftUI
import SNFModels
import SNFServices

// All colors come from SNFKit/SNFModels/Theme.swift — single source of truth

// MARK: - Reusable Badge Views

struct PriorityBadge: View {
    let priority: Priority

    var body: some View {
        Text(priority.rawValue)
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(priority.tintColor)
            .glassEffect(.regular, in: .capsule)
    }
}

struct DomainBadge: View {
    let domain: Domain

    var body: some View {
        Text(domain.label)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(domain.color)
            .glassEffect(.regular, in: .capsule)
    }
}

struct GovernanceBadge: View {
    let level: GovernanceLevel

    var body: some View {
        Text("L\(level.rawValue)")
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(level.badgeColor)
            .glassEffect(.regular, in: .capsule)
    }
}

struct StatusBadge: View {
    let status: DecisionStatus

    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(status.color)
            .glassEffect(.regular, in: .capsule)
    }
}

// MARK: - Star Rating View

struct StarRating: View {
    let rating: Int

    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: star <= rating ? "star.fill" : "star")
                    .font(.caption2)
                    .foregroundStyle(star <= rating ? Color.yellow : Color.gray.opacity(0.3))
            }
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }
}

// MARK: - Relative Time Formatter

func relativeTime(from isoString: String) -> String {
    let formatter = ISO8601DateFormatter()
    guard let date = formatter.date(from: isoString) else { return isoString }
    let relative = RelativeDateTimeFormatter()
    relative.unitsStyle = .abbreviated
    return relative.localizedString(for: date, relativeTo: Date())
}

func relativeTime(from date: Date) -> String {
    let relative = RelativeDateTimeFormatter()
    relative.unitsStyle = .abbreviated
    return relative.localizedString(for: date, relativeTo: Date())
}
