import SwiftUI
import SNFModels
import SNFServices

struct FacilitiesView: View {
    var scopeManager: ScopeManager
    @Binding var selectedFacilityId: String?

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 180, maximum: 240), spacing: 14)
            ], spacing: 14) {
                ForEach(scopeManager.facilitiesInScope()) { facility in
                    Button {
                        selectedFacilityId = facility.id
                    } label: {
                        FacilityCard(
                            facility: facility,
                            isSelected: selectedFacilityId == facility.id
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationTitle("Facilities")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Text("\(scopeManager.facilitiesInScope().count) facilities")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct FacilityCard: View {
    let facility: Facility
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Health Score + Stars
            HStack(alignment: .top) {
                Text("\(facility.healthScore)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundStyle(healthScoreColor(facility.healthScore))
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    StarRating(rating: facility.starRating)
                    surveyRiskIndicator
                }
            }

            // Name + Location
            Text(facility.name)
                .font(.subheadline)
                .fontWeight(.semibold)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            Text("\(facility.city), \(facility.state)")
                .font(.caption)
                .foregroundStyle(.secondary)

            Divider()

            // Metrics row
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Occupancy")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(Int(facility.occupancy))%")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .monospacedDigit()
                }

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text("Census")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(facility.census)/\(facility.beds)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .monospacedDigit()
                }

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text("Incidents")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(facility.openIncidents)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(facility.openIncidents > 0 ? .orange : .green)
                        .monospacedDigit()
                }
            }
        }
        .padding(12)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(isSelected ? .blue : .clear, lineWidth: 2)
        )
    }

    @ViewBuilder
    private var surveyRiskIndicator: some View {
        let color: Color = switch facility.surveyRisk {
        case .low: .green
        case .medium: .orange
        case .high: .red
        }
        HStack(spacing: 3) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            Text(facility.surveyRisk.rawValue)
                .font(.caption2)
                .foregroundStyle(color)
        }
    }
}
