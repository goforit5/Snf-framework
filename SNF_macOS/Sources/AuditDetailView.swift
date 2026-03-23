import SwiftUI
import SNFModels
import SNFServices

struct AuditDetailView: View {
    let entry: AuditEntry
    let allEntries: [AuditEntry]

    private var traceChain: [AuditEntry] {
        allEntries
            .filter { $0.traceId == entry.traceId }
            .sorted { $0.timestamp < $1.timestamp }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                detailsSection
                evidenceSection
                policiesSection
                traceChainSection
            }
            .padding()
        }
        .navigationTitle("Audit Detail")
    }

    // MARK: - Header

    @ViewBuilder
    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: entry.actorType == .agent ? "cpu" : "person.fill")
                    .foregroundStyle(entry.actorType == .agent ? .blue : .purple)
                    .font(.title3)
                Text(entry.actorName)
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
                GovernanceBadge(level: GovernanceLevel(rawValue: entry.governanceLevel) ?? .autonomous)
            }

            Text(entry.action)
                .font(.headline)

            HStack(spacing: 8) {
                Text(entry.disposition)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(dispositionColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(dispositionColor.opacity(0.15))
                    .clipShape(Capsule())

                if let confidence = entry.confidence {
                    Text("Confidence: \(Int(confidence * 100))%")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(entry.timestamp)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
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

    // MARK: - Details

    @ViewBuilder
    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Details", systemImage: "info.circle")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)

            detailRow("Target", entry.target)
            detailRow("Target Type", entry.targetType)
            detailRow("Trace ID", entry.traceId)
            detailRow("Facility ID", entry.facilityId)
            if let parentId = entry.parentId {
                detailRow("Parent ID", parentId)
            }
            if let agentId = entry.agentId {
                detailRow("Agent ID", agentId)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }

    @ViewBuilder
    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.tertiary)
                .frame(width: 90, alignment: .leading)
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .fontDesign(.monospaced)
                .textSelection(.enabled)
        }
    }

    // MARK: - Evidence

    @ViewBuilder
    private var evidenceSection: some View {
        if !entry.evidence.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Evidence", systemImage: "magnifyingglass")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)

                ForEach(entry.evidence, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.caption)
                            .padding(.top, 2)
                        Text(item)
                            .font(.caption)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
        }
    }

    // MARK: - Policies

    @ViewBuilder
    private var policiesSection: some View {
        if !entry.policiesChecked.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Policies Checked", systemImage: "shield.checkered")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)

                ForEach(entry.policiesChecked, id: \.self) { policy in
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

    // MARK: - Trace Chain

    @ViewBuilder
    private var traceChainSection: some View {
        if traceChain.count > 1 {
            VStack(alignment: .leading, spacing: 8) {
                Label("Trace Chain (\(traceChain.count) events)", systemImage: "point.3.connected.trianglepath.dotted")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)

                ForEach(Array(traceChain.enumerated()), id: \.element.id) { index, chainEntry in
                    HStack(spacing: 10) {
                        // Timeline connector
                        VStack(spacing: 0) {
                            Circle()
                                .fill(chainEntry.id == entry.id ? .blue : .gray)
                                .frame(width: 10, height: 10)
                            if index < traceChain.count - 1 {
                                Rectangle()
                                    .fill(.gray.opacity(0.3))
                                    .frame(width: 2)
                                    .frame(maxHeight: .infinity)
                            }
                        }
                        .frame(width: 10)

                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Image(systemName: chainEntry.actorType == .agent ? "cpu" : "person.fill")
                                    .font(.caption2)
                                    .foregroundStyle(chainEntry.actorType == .agent ? .blue : .purple)
                                Text(chainEntry.actorName)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                Spacer()
                                Text(relativeTime(from: chainEntry.timestamp))
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                            Text(chainEntry.action)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                        .padding(.horizontal, 8)
                        .background(chainEntry.id == entry.id ? .blue.opacity(0.08) : .clear)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
        }
    }
}
