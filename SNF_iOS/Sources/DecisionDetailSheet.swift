import SwiftUI
import SNFModels
import SNFServices

struct DecisionDetailSheet: View {
    let decision: Decision
    let engine: DecisionEngine
    let facilityName: String
    @Environment(\.dismiss) private var dismiss
    @State private var showOverridePrompt = false
    @State private var overrideReason = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    headerSection
                    recommendationCard
                    impactCard
                    evidenceSection
                    policiesSection
                }
                .padding()
                .safeAreaInset(edge: .bottom) {
                    if decision.status == .pending {
                        actionBar
                    }
                }
            }
            .navigationTitle("Decision Detail")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .close) { dismiss() }
                }
            }
            .alert("Override Reason", isPresented: $showOverridePrompt) {
                TextField("Reason", text: $overrideReason)
                Button("Override") {
                    engine.override(decision.id, reason: overrideReason)
                    dismiss()
                }
                Button("Cancel", role: .cancel) {
                    overrideReason = ""
                }
            } message: {
                Text("Provide a reason for overriding this decision.")
            }
        }
    }

    // MARK: - Header

    @ViewBuilder
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(decision.title)
                .font(.title2.weight(.bold))

            HStack(spacing: 8) {
                DomainBadge(domain: decision.domain)
                PriorityBadge(priority: decision.priority)
                GovernanceBadge(level: decision.governanceLevel)
            }

            HStack {
                Label(facilityName, systemImage: "building.2")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Spacer()

                ConfidenceGauge(confidence: decision.confidence)
            }

            Text(decision.description)
                .font(.body)
                .foregroundStyle(.primary)
        }
    }

    // MARK: - Recommendation Card

    @ViewBuilder
    private var recommendationCard: some View {
        HStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 2)
                .fill(.green)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 8) {
                Label("Agent Recommendation", systemImage: "sparkles")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.green)

                Text(decision.agentRecommendation)
                    .font(.body)
            }
            .padding()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular, in: .rect(cornerRadius: 12))
    }

    // MARK: - Impact Card

    @ViewBuilder
    private var impactCard: some View {
        HStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 2)
                .fill(.orange)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 8) {
                Label("Estimated Impact", systemImage: "chart.bar.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.orange)

                Text(decision.estimatedImpact)
                    .font(.body)
            }
            .padding()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular, in: .rect(cornerRadius: 12))
    }

    // MARK: - Evidence

    @ViewBuilder
    private var evidenceSection: some View {
        if !decision.evidence.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Evidence", systemImage: "doc.text.magnifyingglass")
                    .font(.subheadline.weight(.semibold))

                ForEach(decision.evidence, id: \.self) { item in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.blue)
                            .font(.caption)
                            .padding(.top, 2)
                        Text(item)
                            .font(.subheadline)
                    }
                }
            }
        }
    }

    // MARK: - Policies

    @ViewBuilder
    private var policiesSection: some View {
        if !decision.policiesChecked.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Policies Checked", systemImage: "checkmark.shield.fill")
                    .font(.subheadline.weight(.semibold))

                ForEach(decision.policiesChecked, id: \.self) { policy in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "shield.checkered")
                            .foregroundStyle(.green)
                            .font(.caption)
                            .padding(.top, 2)
                        Text(policy)
                            .font(.subheadline)
                    }
                }
            }
        }
    }

    // MARK: - Action Bar (pinned to bottom)

    @ViewBuilder
    private var actionBar: some View {
        VStack(spacing: 10) {
            // Primary: Approve — large, prominent
            Button {
                engine.approve(decision.id)
                dismiss()
            } label: {
                Text("Approve")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .tint(.green)
            .sensoryFeedback(.success, trigger: decision.status)

            // Secondary: icon-only to prevent text wrapping
            HStack(spacing: 12) {
                Button {
                    showOverridePrompt = true
                } label: {
                    Label("Override", systemImage: "arrow.uturn.backward.circle")
                        .labelStyle(.titleAndIcon)
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    engine.escalate(decision.id)
                    dismiss()
                } label: {
                    Label("Escalate", systemImage: "arrow.up.circle")
                        .labelStyle(.titleAndIcon)
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.orange)

                Button {
                    engine.defer(decision.id)
                    dismiss()
                } label: {
                    Label("Defer", systemImage: "clock")
                        .labelStyle(.titleAndIcon)
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .glassEffect(.regular, in: .rect(cornerRadius: 16))
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}
