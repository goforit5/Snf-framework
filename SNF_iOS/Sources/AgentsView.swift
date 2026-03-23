import SwiftUI
import SNFModels
import SNFServices
import SNFData

struct AgentsView: View {
    let dataProvider: MockDataProvider
    @State private var agents: [Agent] = []
    @State private var selectedAgent: Agent?

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(agents) { agent in
                        AgentCard(agent: agent)
                            .onTapGesture {
                                selectedAgent = agent
                            }
                    }
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
            .sheet(item: $selectedAgent) { agent in
                AgentDetailSheet(agent: agent)
            }
        }
    }
}

// MARK: - Agent Card

struct AgentCard: View {
    let agent: Agent

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(agent.isActive ? .green : .red)
                    .frame(width: 10, height: 10)

                Text(agent.displayName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
            }

            DomainBadge(domain: agent.domain)

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(agent.actionsToday)")
                        .font(.title3.weight(.bold).monospacedDigit())
                    Text("Actions")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(agent.exceptionsToday)")
                        .font(.title3.weight(.bold).monospacedDigit())
                        .foregroundStyle(agent.exceptionsToday > 0 ? .orange : .primary)
                    Text("Exceptions")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .glassEffect(.regular, in: .rect(cornerRadius: 16))
    }
}

// MARK: - Agent Detail Sheet

struct AgentDetailSheet: View {
    let agent: Agent
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Status") {
                    HStack {
                        Text("Status")
                        Spacer()
                        HStack(spacing: 6) {
                            Circle()
                                .fill(agent.isActive ? .green : .red)
                                .frame(width: 8, height: 8)
                            Text(agent.status.capitalized)
                                .foregroundStyle(agent.isActive ? .green : .red)
                                .fontWeight(.medium)
                        }
                    }

                    LabeledContent("Last Run", value: agent.lastRun)
                    LabeledContent("Avg Confidence", value: "\(Int(agent.confidenceAvg * 100))%")

                    HStack {
                        Text("Governance")
                        Spacer()
                        GovernanceBadge(level: agent.governanceLevel)
                    }
                }

                Section("Today's Activity") {
                    LabeledContent("Actions", value: "\(agent.actionsToday)")
                    LabeledContent("Exceptions", value: "\(agent.exceptionsToday)")
                }

                if !agent.policiesEnforced.isEmpty {
                    Section("Policies Enforced") {
                        ForEach(agent.policiesEnforced, id: \.self) { policy in
                            Label(policy, systemImage: "checkmark.shield")
                                .font(.subheadline)
                        }
                    }
                }

                if !agent.triggers.isEmpty {
                    Section("Triggers") {
                        ForEach(agent.triggers, id: \.self) { trigger in
                            Label(trigger, systemImage: "bolt.circle")
                                .font(.subheadline)
                        }
                    }
                }

                Section("Info") {
                    LabeledContent("ID", value: agent.id)
                    LabeledContent("Internal Name", value: agent.name)

                    HStack {
                        Text("Domain")
                        Spacer()
                        DomainBadge(domain: agent.domain)
                    }

                    Text(agent.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle(agent.displayName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .close) { dismiss() }
                }
            }
        }
    }
}
