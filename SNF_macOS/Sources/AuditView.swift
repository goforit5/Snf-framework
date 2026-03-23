import SwiftUI
import SNFModels
import SNFServices
import SNFData

struct AuditView: View {
    var dataProvider: MockDataProvider
    @Binding var selectedAuditId: String?
    @State private var entries: [AuditEntry] = []
    @State private var filterActorType: ActorType?

    private var filteredEntries: [AuditEntry] {
        var result = entries
        if let actorType = filterActorType {
            result = result.filter { $0.actorType == actorType }
        }
        return result.sorted { $0.timestamp > $1.timestamp }
    }

    var body: some View {
        VStack(spacing: 0) {
            filterBar
            Divider()
            auditList
        }
        .navigationTitle("Audit Trail")
        .task {
            do {
                entries = try await dataProvider.fetchAuditLog(traceId: nil)
            } catch {
                print("Failed to load audit log: \(error)")
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Text("\(filteredEntries.count) entries")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Filter Bar

    @ViewBuilder
    private var filterBar: some View {
        HStack(spacing: 8) {
            Text("Actor:")
                .font(.caption)
                .foregroundStyle(.secondary)

            Picker("Actor Type", selection: $filterActorType) {
                Text("All").tag(nil as ActorType?)
                Text("Agent").tag(ActorType.agent as ActorType?)
                Text("Human").tag(ActorType.human as ActorType?)
            }
            .pickerStyle(.segmented)
            .frame(width: 200)

            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    // MARK: - Audit List

    @ViewBuilder
    private var auditList: some View {
        List(selection: $selectedAuditId) {
            ForEach(filteredEntries) { entry in
                AuditRow(entry: entry)
                    .tag(entry.id)
            }
        }
        .listStyle(.inset)
    }
}

// MARK: - Audit Row

struct AuditRow: View {
    let entry: AuditEntry

    var body: some View {
        HStack(spacing: 10) {
            // Actor icon
            Image(systemName: entry.actorType == .agent ? "cpu" : "person.fill")
                .foregroundStyle(entry.actorType == .agent ? .blue : .purple)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(entry.action)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Spacer()
                    GovernanceBadge(level: GovernanceLevel(rawValue: entry.governanceLevel) ?? .autonomous)
                }

                HStack(spacing: 6) {
                    Text(entry.actorName)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text("->")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)

                    Text(entry.target)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 6) {
                    Text(entry.disposition)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundStyle(dispositionColor)

                    Spacer()

                    Text(relativeTime(from: entry.timestamp))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 2)
    }

    private var dispositionColor: Color {
        switch entry.disposition.lowercased() {
        case "approved", "auto-approved", "executed": .green
        case "escalated": .red
        case "overridden": .orange
        case "deferred": .gray
        default: .secondary
        }
    }
}
