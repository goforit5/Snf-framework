import SwiftUI
import SNFModels
import SNFServices

struct DecisionDetailView: View {
    let decision: Decision
    var decisionEngine: DecisionEngine
    @State private var overrideReason = ""
    @State private var showOverrideSheet = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                descriptionSection
                recommendationSection
                impactSection
                evidenceSection
                policiesSection
                actionButtons
            }
            .padding()
        }
        .navigationTitle("Decision Detail")
        .sheet(isPresented: $showOverrideSheet) {
            overrideSheet
        }
    }

    // MARK: - Header

    @ViewBuilder
    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(decision.title)
                .font(.title3)
                .fontWeight(.bold)

            HStack(spacing: 8) {
                DomainBadge(domain: decision.domain)
                PriorityBadge(priority: decision.priority)
                GovernanceBadge(level: decision.governanceLevel)
                StatusBadge(status: decision.status)
            }

            HStack {
                Label("Confidence: \(Int(decision.confidence * 100))%", systemImage: "gauge.medium")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("Due \(relativeTime(from: decision.dueBy))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
    }

    // MARK: - Description

    @ViewBuilder
    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Details", systemImage: "doc.text")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)
            Text(decision.description)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 10))
    }

    // MARK: - Recommendation

    @ViewBuilder
    private var recommendationSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Agent Recommendation", systemImage: "cpu")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.green)
            Text(decision.agentRecommendation)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Estimated Impact

    @ViewBuilder
    private var impactSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Estimated Impact", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.orange)
            Text(decision.estimatedImpact)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Evidence

    @ViewBuilder
    private var evidenceSection: some View {
        if !decision.evidence.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Label("Evidence", systemImage: "magnifyingglass")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                ForEach(decision.evidence, id: \.self) { item in
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
        if !decision.policiesChecked.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Label("Policies Checked", systemImage: "shield.checkered")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                ForEach(decision.policiesChecked, id: \.self) { policy in
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

    // MARK: - Actions

    @ViewBuilder
    private var actionButtons: some View {
        if decision.status == .pending {
            HStack(spacing: 12) {
                Button {
                    decisionEngine.approve(decision.id)
                } label: {
                    Label("Approve", systemImage: "checkmark.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)

                Button {
                    showOverrideSheet = true
                } label: {
                    Label("Override", systemImage: "arrow.triangle.2.circlepath")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    decisionEngine.escalate(decision.id)
                } label: {
                    Label("Escalate", systemImage: "arrow.up.to.line")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.red)

                Button {
                    decisionEngine.defer(decision.id)
                } label: {
                    Label("Defer", systemImage: "clock.arrow.circlepath")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.gray)
            }
            .controlSize(.large)
            .padding(.top, 4)
        }
    }

    // MARK: - Override Sheet

    @ViewBuilder
    private var overrideSheet: some View {
        VStack(spacing: 16) {
            Text("Override Decision")
                .font(.headline)
            Text("Provide a reason for overriding the agent recommendation.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            TextField("Reason for override...", text: $overrideReason, axis: .vertical)
                .lineLimit(3...6)
                .textFieldStyle(.roundedBorder)
            HStack {
                Button(role: .close) {
                    showOverrideSheet = false
                    overrideReason = ""
                }
                Spacer()
                Button("Confirm Override") {
                    decisionEngine.override(decision.id, reason: overrideReason)
                    showOverrideSheet = false
                    overrideReason = ""
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .disabled(overrideReason.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .padding()
        .frame(width: 400)
    }
}
