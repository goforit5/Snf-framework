import SwiftUI
import SNFModels
import SNFServices

struct FeedView: View {
    let engine: DecisionEngine
    let scopeManager: ScopeManager
    @State private var selectedDecision: Decision?
    @State private var actionSheetDecision: Decision?
    @State private var overrideReason = ""
    @State private var showOverridePrompt = false

    var body: some View {
        NavigationStack {
            List {
                statsHeader

                ForEach(Priority.allCases, id: \.self) { priority in
                    let items = decisionsForPriority(priority)
                    if !items.isEmpty {
                        Section {
                            ForEach(items) { decision in
                                DecisionRow(decision: decision, facility: facilityName(for: decision))
                                    .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        selectedDecision = decision
                                    }
                                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                        Button {
                                            withAnimation {
                                                engine.approve(decision.id)
                                            }
                                        } label: {
                                            Label("Approve", systemImage: "checkmark.circle.fill")
                                        }
                                        .tint(.green)
                                    }
                                    .swipeActions(edge: .leading, allowsFullSwipe: false) {
                                        Button {
                                            actionSheetDecision = decision
                                            showOverridePrompt = true
                                        } label: {
                                            Label("Override", systemImage: "arrow.uturn.backward.circle")
                                        }
                                        .tint(.purple)

                                        Button {
                                            withAnimation {
                                                engine.escalate(decision.id)
                                            }
                                        } label: {
                                            Label("Escalate", systemImage: "arrow.up.circle")
                                        }
                                        .tint(.orange)

                                        Button {
                                            withAnimation {
                                                engine.defer(decision.id)
                                            }
                                        } label: {
                                            Label("Defer", systemImage: "clock.arrow.circlepath")
                                        }
                                        .tint(.gray)
                                    }
                                    .sensoryFeedback(.success, trigger: engine.decisions.first { $0.id == decision.id }?.status == .approved)
                            }
                        } header: {
                            HStack {
                                Image(systemName: priority.iconName)
                                    .foregroundStyle(priority.tintColor)
                                Text(priority.rawValue.uppercased())
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(priority.tintColor)
                                Spacer()
                                Text("\(items.count)")
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Decisions")
            .refreshable {
                do {
                    try await engine.load(scope: scopeManager.currentScope)
                } catch {
                    print("Refresh error: \(error)")
                }
            }
            .sheet(item: $selectedDecision) { decision in
                DecisionDetailSheet(decision: decision, engine: engine, facilityName: facilityName(for: decision))
            }
            .alert("Override Reason", isPresented: $showOverridePrompt) {
                TextField("Reason", text: $overrideReason)
                Button("Override") {
                    if let decision = actionSheetDecision {
                        engine.override(decision.id, reason: overrideReason)
                    }
                    overrideReason = ""
                    actionSheetDecision = nil
                }
                Button("Cancel", role: .cancel) {
                    overrideReason = ""
                    actionSheetDecision = nil
                }
            } message: {
                Text("Provide a reason for overriding this decision.")
            }
        }
    }

    // MARK: - Stats Header

    @ViewBuilder
    private var statsHeader: some View {
        Section {
            let s = engine.stats
            HStack(spacing: 0) {
                StatPill(label: "Pending", value: s.pending, color: .blue)
                StatPill(label: "Approved", value: s.approved, color: .green)
                StatPill(label: "Escalated", value: s.escalated, color: .orange)
                StatPill(label: "Deferred", value: s.deferred, color: .secondary)
            }
            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
        }
    }

    // MARK: - Helpers

    private func decisionsForPriority(_ priority: Priority) -> [Decision] {
        engine.pending.filter { $0.priority == priority }
    }

    private func facilityName(for decision: Decision) -> String {
        scopeManager.facilities.first { $0.id == decision.facilityId }?.name ?? decision.facilityId
    }
}

// MARK: - Decision Row

struct DecisionRow: View {
    let decision: Decision
    let facility: String

    var body: some View {
        HStack(spacing: 0) {
            // Priority color bar — full height, left edge
            RoundedRectangle(cornerRadius: 2)
                .fill(decision.priority.tintColor)
                .frame(width: 4)
                .padding(.trailing, 12)

            VStack(alignment: .leading, spacing: 6) {
                Text(decision.title)
                    .font(.body.weight(.medium))
                    .lineLimit(2)
                    .foregroundStyle(.primary)

                Text(facility)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    DomainBadge(domain: decision.domain)
                    GovernanceBadge(level: decision.governanceLevel)
                    Spacer()
                    ConfidenceGauge(confidence: decision.confidence)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Stat Pill

struct StatPill: View {
    let label: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.title3.weight(.bold).monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
