import Foundation
import SNFModels

public struct BriefingData: Sendable {
    public let summaryText: String
    public let criticalCount: Int
    public let highCount: Int
    public let mediumCount: Int
    public let lowCount: Int
    public let facilitiesAtRisk: [Facility]
    public let topDecisions: [Decision]
}

@MainActor
public struct BriefingEngine {
    public static func generate(
        decisions: [Decision],
        facilities: [Facility]
    ) -> BriefingData {
        let pending = decisions.filter { $0.status == .pending }
        let critical = pending.filter { $0.priority == .critical }
        let high = pending.filter { $0.priority == .high }
        let medium = pending.filter { $0.priority == .medium }
        let low = pending.filter { $0.priority == .low }

        let atRisk = facilities.filter { $0.healthScore < 75 }
            .sorted { $0.healthScore < $1.healthScore }

        let sorted = pending.sorted { ($0.priority, $0.confidence) < ($1.priority, $1.confidence) }
        let top = Array(sorted.prefix(5))

        var parts: [String] = []
        if !critical.isEmpty {
            parts.append("\(critical.count) critical item\(critical.count == 1 ? "" : "s") need\(critical.count == 1 ? "s" : "") immediate attention")
        }
        if !high.isEmpty {
            parts.append("\(high.count) high-priority decision\(high.count == 1 ? "" : "s") pending")
        }
        if !atRisk.isEmpty {
            let names = atRisk.map(\.name).joined(separator: ", ")
            parts.append("\(names) \(atRisk.count == 1 ? "is" : "are") below health threshold")
        }

        let summary = parts.isEmpty ? "All clear — no pending decisions." : parts.joined(separator: ". ") + "."

        return BriefingData(
            summaryText: summary,
            criticalCount: critical.count,
            highCount: high.count,
            mediumCount: medium.count,
            lowCount: low.count,
            facilitiesAtRisk: atRisk,
            topDecisions: top
        )
    }
}
