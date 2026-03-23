import SwiftUI
import SNFModels
import SNFServices

struct AgentDetailView: View {
    let agent: Agent

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                metricsRow
                policiesSection
                triggersSection
            }
            .padding()
        }
        .navigationTitle("Agent Detail")
    }

    // MARK: - Header

    @ViewBuilder
    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(agent.isActive ? .green : .gray)
                            .frame(width: 10, height: 10)
                        Text(agent.isActive ? "Active" : "Inactive")
                            .font(.caption)
                            .foregroundStyle(agent.isActive ? .green : .gray)
                    }

                    Text(agent.displayName)
                        .font(.title3)
                        .fontWeight(.bold)

                    Text(agent.name)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .fontDesign(.monospaced)
                }
                Spacer()
                GovernanceBadge(level: agent.governanceLevel)
            }

            HStack(spacing: 8) {
                DomainBadge(domain: agent.domain)
                Text("Last run: \(agent.lastRun)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(agent.description)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
    }

    // MARK: - Metrics

    @ViewBuilder
    private var metricsRow: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Actions Today",
                value: "\(agent.actionsToday)",
                color: .blue
            )
            StatCard(
                title: "Exceptions",
                value: "\(agent.exceptionsToday)",
                color: agent.exceptionsToday > 0 ? .orange : .green
            )
            StatCard(
                title: "Avg Confidence",
                value: "\(Int(agent.confidenceAvg * 100))%",
                color: .purple
            )
        }
    }

    // MARK: - Policies

    @ViewBuilder
    private var policiesSection: some View {
        if !agent.policiesEnforced.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Policies Enforced", systemImage: "shield.checkered")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)

                ForEach(agent.policiesEnforced, id: \.self) { policy in
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "lock.shield.fill")
                            .foregroundStyle(.blue)
                            .font(.caption)
                            .padding(.top, 2)
                        Text(policy)
                            .font(.caption)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
        }
    }

    // MARK: - Triggers

    @ViewBuilder
    private var triggersSection: some View {
        if !agent.triggers.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Triggers", systemImage: "bolt.fill")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)

                ForEach(agent.triggers, id: \.self) { trigger in
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "bolt.circle.fill")
                            .foregroundStyle(.yellow)
                            .font(.caption)
                            .padding(.top, 2)
                        Text(trigger)
                            .font(.caption)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
        }
    }
}
