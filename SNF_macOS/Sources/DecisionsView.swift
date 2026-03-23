import SwiftUI
import SNFModels
import SNFServices

struct DecisionsView: View {
    var decisionEngine: DecisionEngine
    @Binding var selectedDecisionId: String?
    @State private var activeDomains: Set<Domain> = []
    @State private var selectedIds: Set<String> = []
    @State private var showAllStatuses = false

    private var filteredDecisions: [Decision] {
        let source = showAllStatuses ? decisionEngine.decisions : decisionEngine.pending
        if activeDomains.isEmpty { return source }
        return source.filter { activeDomains.contains($0.domain) }
    }

    var body: some View {
        VStack(spacing: 0) {
            filterBar
            Divider()
            decisionList
        }
        .navigationTitle("Decisions")
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Toggle("All Statuses", isOn: $showAllStatuses)
                    .toggleStyle(.switch)
                    .controlSize(.small)

                Button("Approve Selected (\(selectedIds.count))") {
                    decisionEngine.bulkApprove(Array(selectedIds))
                    selectedIds.removeAll()
                }
                .disabled(selectedIds.isEmpty)
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .controlSize(.small)
            }
        }
        .searchable(text: .constant(""), placement: .toolbar)
    }

    // MARK: - Filter Bar

    @ViewBuilder
    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(domainsPresent, id: \.self) { domain in
                    DomainFilterChip(
                        domain: domain,
                        isActive: activeDomains.contains(domain)
                    ) {
                        if activeDomains.contains(domain) {
                            activeDomains.remove(domain)
                        } else {
                            activeDomains.insert(domain)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    private var domainsPresent: [Domain] {
        let all = Set(decisionEngine.decisions.map(\.domain))
        return Domain.allCases.filter { all.contains($0) }
    }

    // MARK: - Decision List

    @ViewBuilder
    private var decisionList: some View {
        List(selection: $selectedDecisionId) {
            ForEach(filteredDecisions) { decision in
                DecisionRow(
                    decision: decision,
                    isChecked: selectedIds.contains(decision.id),
                    onToggleCheck: {
                        if selectedIds.contains(decision.id) {
                            selectedIds.remove(decision.id)
                        } else {
                            selectedIds.insert(decision.id)
                        }
                    }
                )
                .tag(decision.id)
            }
        }
        .listStyle(.inset)
        .onKeyPress(.init("j")) {
            navigateList(direction: .down)
            return .handled
        }
        .onKeyPress(.init("k")) {
            navigateList(direction: .up)
            return .handled
        }
        .onKeyPress(.init("a")) {
            if let id = selectedDecisionId {
                decisionEngine.approve(id)
            }
            return .handled
        }
        .onKeyPress(.init("e")) {
            if let id = selectedDecisionId {
                decisionEngine.escalate(id)
            }
            return .handled
        }
        .onKeyPress(.init("d")) {
            if let id = selectedDecisionId {
                decisionEngine.defer(id)
            }
            return .handled
        }
    }

    private enum ListDirection { case up, down }

    private func navigateList(direction: ListDirection) {
        let list = filteredDecisions
        guard !list.isEmpty else { return }

        guard let currentId = selectedDecisionId,
              let currentIndex = list.firstIndex(where: { $0.id == currentId }) else {
            selectedDecisionId = list.first?.id
            return
        }

        switch direction {
        case .down:
            let next = list.index(after: currentIndex)
            if next < list.endIndex {
                selectedDecisionId = list[next].id
            }
        case .up:
            if currentIndex > list.startIndex {
                let prev = list.index(before: currentIndex)
                selectedDecisionId = list[prev].id
            }
        }
    }
}

// MARK: - Domain Filter Chip

struct DomainFilterChip: View {
    let domain: Domain
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(domain.label)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(isActive ? domain.color.opacity(0.3) : Color.clear)
                .foregroundStyle(isActive ? domain.color : .secondary)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(isActive ? domain.color : Color.gray.opacity(0.3), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Decision Row

struct DecisionRow: View {
    let decision: Decision
    let isChecked: Bool
    let onToggleCheck: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(decision.priority.color)
                .frame(width: 4)
                .clipShape(RoundedRectangle(cornerRadius: 2))

            HStack(spacing: 10) {
                Button {
                    onToggleCheck()
                } label: {
                    Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(isChecked ? Color.green : Color.gray.opacity(0.3))
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 4) {
                    Text(decision.title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        DomainBadge(domain: decision.domain)
                        GovernanceBadge(level: decision.governanceLevel)
                        StatusBadge(status: decision.status)
                        Spacer()
                        Text("\(Int(decision.confidence * 100))%")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .monospacedDigit()
                    }
                }

                Image(systemName: decision.priority.iconName)
                    .foregroundStyle(decision.priority.color)
                    .imageScale(.small)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
        }
    }
}
