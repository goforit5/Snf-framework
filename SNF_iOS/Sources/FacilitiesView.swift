import SwiftUI
import SNFModels
import SNFServices

struct FacilitiesView: View {
    let scopeManager: ScopeManager
    @State private var selectedFacility: Facility?

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(scopeManager.facilitiesInScope()) { facility in
                        FacilityCard(facility: facility)
                            .onTapGesture {
                                selectedFacility = facility
                            }
                    }
                }
                .padding()
            }
            .navigationTitle("Facilities")
            .sheet(item: $selectedFacility) { facility in
                FacilityDetailSheet(facility: facility)
            }
        }
    }
}

// MARK: - Facility Card

struct FacilityCard: View {
    let facility: Facility

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("\(facility.healthScore)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundStyle(healthScoreColor(facility.healthScore))

                Spacer()

                HStack(spacing: 2) {
                    ForEach(1...5, id: \.self) { star in
                        Image(systemName: star <= facility.starRating ? "star.fill" : "star")
                            .font(.caption2)
                            .foregroundStyle(star <= facility.starRating ? Color.yellow : Color.gray.opacity(0.3))
                    }
                }
            }

            Text(facility.name)
                .font(.subheadline.weight(.semibold))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            Text("\(facility.city), \(facility.state)")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack {
                Label("\(Int(facility.occupancy))%", systemImage: "bed.double")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(facility.census)/\(facility.beds)")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .glassEffect(.regular, in: .rect(cornerRadius: 16))
    }
}

// MARK: - Facility Detail Sheet

struct FacilityDetailSheet: View {
    let facility: Facility
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Overview") {
                    HStack {
                        Text("Health Score")
                        Spacer()
                        Text("\(facility.healthScore)")
                            .font(.title.weight(.bold))
                            .foregroundStyle(healthScoreColor(facility.healthScore))
                    }

                    HStack {
                        Text("Star Rating")
                        Spacer()
                        HStack(spacing: 2) {
                            ForEach(1...5, id: \.self) { star in
                                Image(systemName: star <= facility.starRating ? "star.fill" : "star")
                                    .foregroundStyle(star <= facility.starRating ? Color.yellow : Color.gray.opacity(0.3))
                            }
                        }
                    }

                    LabeledContent("Region", value: facility.region)
                    LabeledContent("Administrator", value: facility.administrator)
                    LabeledContent("DON", value: facility.don)
                    LabeledContent("Phone", value: facility.phone)
                }

                Section("Census & Capacity") {
                    LabeledContent("Licensed Beds", value: "\(facility.beds)")
                    LabeledContent("Current Census", value: "\(facility.census)")
                    LabeledContent("Occupancy", value: "\(Int(facility.occupancy))%")
                }

                Section("Financial") {
                    LabeledContent("Labor %", value: String(format: "%.1f%%", facility.laborPct))
                    LabeledContent("AP Aging", value: "$\(facility.apAging / 1000)K")
                }

                Section("Risk & Compliance") {
                    HStack {
                        Text("Survey Risk")
                        Spacer()
                        Text(facility.surveyRisk.rawValue)
                            .foregroundStyle(facility.surveyRisk.color)
                            .fontWeight(.semibold)
                    }
                    LabeledContent("Open Incidents", value: "\(facility.openIncidents)")
                    LabeledContent("Last Survey", value: facility.lastSurveyDate)
                }
            }
            .navigationTitle(facility.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .close) { dismiss() }
                }
            }
        }
    }
}
