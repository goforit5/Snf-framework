import SwiftUI
import SNFModels
import SNFServices
import SNFData

struct AgentsView: View {
    var dataProvider: MockDataProvider
    @Binding var selectedAgentId: String?
    @State private var agents: [Agent] = []
    @State private var filterDomain: Domain?

    private var filteredAgents: [Agent] {
        guard let domain = filterDomain else { return agents }
        return agents.filter { $0.domain == domain }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                statsBar
                domainFilter
                agentGrid
            }
            .padding()
        }
        .navigationTitle("Agents")
        .task {
            do {
                agents = try await dataProvider.fetchAgents()
            } catch {
                print("Failed to load agents: \(error)")
            }
        }
    }

    // MARK: - Stats Bar

    @ViewBuilder
    private var statsBar: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Total Agents",
                value: "\(agents.count)",
                color: .blue
            )
            StatCard(
                title: "Active",
                value: "\(agents.filter(\.isActive).count)",
                color: .green
            )
            StatCard(
                title: "Actions Today",
                value: "\(agents.reduce(0) { $0 + $1.actionsToday })",
                color: .purple
            )
            StatCard(
                title: "Exceptions",
                value: "\(agents.reduce(0) { $0 + $1.exceptionsToday })",
                color: .orange
            )
        }
    }

    // MARK: - Domain Filter

    @ViewBuilder
    private var domainFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                Button {
                    filterDomain = nil
                } label: {
                    Text("All")
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(filterDomain == nil ? Color.blue.opacity(0.3) : Color.clear)
                        .foregroundStyle(filterDomain == nil ? .blue : .secondary)
                        .clipShape(Capsule())
                        .overlay(Capsule().strokeBorder(filterDomain == nil ? Color.blue : Color.gray.opacity(0.3), lineWidth: 1))
                }
                .buttonStyle(.plain)

                let domainsPresent = Set(agents.map(\.domain))
                ForEach(Domain.allCases.filter { domainsPresent.contains($0) }, id: \.self) { domain in
                    DomainFilterChip(
                        domain: domain,
                        isActive: filterDomain == domain
                    ) {
                        filterDomain = filterDomain == domain ? nil : domain
                    }
                }
            }
        }
    }

    // MARK: - Agent Grid

    @ViewBuilder
    private var agentGrid: some View {
        LazyVGrid(columns: [
            GridItem(.adaptive(minimum: 200, maximum: 280), spacing: 12)
        ], spacing: 12) {
            ForEach(filteredAgents) { agent in
                Button {
                    selectedAgentId = agent.id
                } label: {
                    AgentCard(
                        agent: agent,
                        isSelected: selectedAgentId == agent.id
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Agent Card

struct AgentCard: View {
    let agent: Agent
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(agent.isActive ? .green : .gray)
                    .frame(width: 8, height: 8)

                Text(agent.displayName)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(1)

                Spacer()

                GovernanceBadge(level: agent.governanceLevel)
            }

            DomainBadge(domain: agent.domain)

            Text(agent.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Actions")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(agent.actionsToday)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .monospacedDigit()
                }

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text("Exceptions")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(agent.exceptionsToday)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(agent.exceptionsToday > 0 ? .orange : .green)
                        .monospacedDigit()
                }

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text("Confidence")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(Int(agent.confidenceAvg * 100))%")
                        .font(.caption)
                        .fontWeight(.bold)
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
}
