import SwiftUI
import SNFModels
import SNFServices

struct FacilityDetailView: View {
    let facility: Facility

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                metricsGrid
                operationalDetails
                contactInfo
            }
            .padding()
        }
        .navigationTitle("Facility Detail")
    }

    // MARK: - Header

    @ViewBuilder
    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(facility.name)
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("\(facility.city), \(facility.state)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text(facility.region)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(facility.healthScore)")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(healthScoreColor(facility.healthScore))
                    StarRating(rating: facility.starRating)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
    }

    // MARK: - Metrics Grid

    @ViewBuilder
    private var metricsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
        ], spacing: 12) {
            metricCard(title: "Occupancy", value: "\(Int(facility.occupancy))%",
                       icon: "bed.double", color: facility.occupancy > 85 ? .green : .orange)
            metricCard(title: "Census", value: "\(facility.census) / \(facility.beds)",
                       icon: "person.3", color: .blue)
            metricCard(title: "Open Incidents", value: "\(facility.openIncidents)",
                       icon: "exclamationmark.triangle", color: facility.openIncidents > 2 ? .red : .green)
            metricCard(title: "Survey Risk", value: facility.surveyRisk.rawValue,
                       icon: "shield.checkered", color: surveyRiskColor)
            metricCard(title: "Labor %", value: String(format: "%.1f%%", facility.laborPct),
                       icon: "person.crop.circle", color: facility.laborPct > 50 ? .red : .green)
            metricCard(title: "AP Aging", value: "$\(facility.apAging / 1000)K",
                       icon: "calendar.badge.clock", color: facility.apAging > 300000 ? .red : .green)
        }
    }

    private var surveyRiskColor: Color {
        switch facility.surveyRisk {
        case .low: .green
        case .medium: .orange
        case .high: .red
        }
    }

    @ViewBuilder
    private func metricCard(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(title, systemImage: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }

    // MARK: - Operational Details

    @ViewBuilder
    private var operationalDetails: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Operations", systemImage: "gearshape.2")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)

            infoRow("Last Survey", facility.lastSurveyDate)
            infoRow("Beds", "\(facility.beds)")
            infoRow("Region", facility.region)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }

    // MARK: - Contact Info

    @ViewBuilder
    private var contactInfo: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Leadership", systemImage: "person.crop.rectangle.stack")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)

            infoRow("Administrator", facility.administrator)
            infoRow("DON", facility.don)
            infoRow("Phone", facility.phone)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }

    @ViewBuilder
    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.tertiary)
                .frame(width: 100, alignment: .leading)
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}
