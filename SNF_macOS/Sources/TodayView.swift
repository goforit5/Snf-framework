import SwiftUI
import SNFModels
import SNFServices

struct TodayView: View {
    var decisionEngine: DecisionEngine
    var scopeManager: ScopeManager
    @Binding var selectedDecisionId: String?
    @Binding var selectedFacilityId: String?
    var navigateToDecisions: () -> Void
    var navigateToFacilities: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                briefingSection
                statsRow
                topDecisionsSection
                facilityHealthSection
            }
            .padding()
        }
        .navigationTitle("Today")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Text(scopeManager.scopeLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.quaternary)
                    .clipShape(Capsule())
            }
        }
    }

    private var briefing: BriefingData {
        BriefingEngine.generate(
            decisions: decisionEngine.decisions,
            facilities: scopeManager.facilitiesInScope()
        )
    }

    // MARK: - Briefing

    @ViewBuilder
    private var briefingSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Morning Briefing", systemImage: "sun.horizon.fill")
                .font(.headline)
                .foregroundStyle(.orange)

            Text(briefing.summaryText)
                .font(.body)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
    }

    // MARK: - Stats Row

    @ViewBuilder
    private var statsRow: some View {
        let stats = decisionEngine.stats
        HStack(spacing: 12) {
            StatCard(title: "Pending", value: "\(stats.pending)", color: .yellow)
            StatCard(title: "Critical", value: "\(briefing.criticalCount)", color: .red)
            StatCard(title: "High", value: "\(briefing.highCount)", color: .orange)
            StatCard(title: "Approved", value: "\(stats.approved)", color: .green)
        }
    }

    // MARK: - Top Decisions

    @ViewBuilder
    private var topDecisionsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Top Decisions")
                    .font(.headline)
                Spacer()
                Button("View All") {
                    navigateToDecisions()
                }
                .buttonStyle(.plain)
                .foregroundStyle(.blue)
                .font(.caption)
            }

            ForEach(briefing.topDecisions) { decision in
                CompactDecisionCard(decision: decision)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        let id = decision.id
                        DispatchQueue.main.async {
                            selectedDecisionId = id
                            navigateToDecisions()
                        }
                    }
            }
        }
    }

    // MARK: - Facility Health Grid

    @ViewBuilder
    private var facilityHealthSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Facility Health")
                .font(.headline)

            let facilities = scopeManager.facilitiesInScope()
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 160, maximum: 220), spacing: 12)
            ], spacing: 12) {
                ForEach(facilities.prefix(8)) { facility in
                    FacilityHealthCard(facility: facility)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            let id = facility.id
                            DispatchQueue.main.async {
                                selectedFacilityId = id
                                navigateToFacilities()
                            }
                        }
                }
            }
        }
    }
}

// MARK: - Compact Decision Card

struct CompactDecisionCard: View {
    let decision: Decision

    var body: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(decision.priority.color)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(decision.title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    Spacer()
                    PriorityBadge(priority: decision.priority)
                }

                HStack {
                    DomainBadge(domain: decision.domain)
                    GovernanceBadge(level: decision.governanceLevel)
                    Spacer()
                    Text("\(Int(decision.confidence * 100))%")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
        }
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 8))
    }
}

// MARK: - Facility Health Card

struct FacilityHealthCard: View {
    let facility: Facility

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("\(facility.healthScore)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundStyle(healthScoreColor(facility.healthScore))
                Spacer()
                StarRating(rating: facility.starRating)
            }

            Text(facility.name)
                .font(.caption)
                .fontWeight(.medium)
                .lineLimit(1)

            Text(facility.city)
                .font(.caption2)
                .foregroundStyle(.secondary)

            HStack {
                Label("\(Int(facility.occupancy))%", systemImage: "bed.double")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
                if facility.openIncidents > 0 {
                    Label("\(facility.openIncidents)", systemImage: "exclamationmark.triangle")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding(10)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }
}
