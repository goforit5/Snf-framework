import Foundation
import SNFModels
import SNFData

// Port of useDecisionQueue.js — same state machine

public struct ActionLogEntry: Sendable {
    public let decisionId: String
    public let action: DecisionStatus
    public let timestamp: Date
    public let reason: String?
}

public struct DecisionStats: Sendable {
    public let total: Int
    public let pending: Int
    public let approved: Int
    public let overridden: Int
    public let escalated: Int
    public let deferred: Int
}

@Observable
@MainActor
public final class DecisionEngine {
    public private(set) var decisions: [Decision] = []
    public private(set) var actionLog: [ActionLogEntry] = []

    private let dataProvider: any DataProvider

    public init(dataProvider: any DataProvider) {
        self.dataProvider = dataProvider
    }

    public func load(scope: ScopeType) async throws {
        decisions = try await dataProvider.fetchDecisions(scope: scope)
    }

    // MARK: - Computed

    public var pending: [Decision] {
        decisions
            .filter { $0.status == .pending }
            .sorted { ($0.priority, $0.confidence) < ($1.priority, $1.confidence) }
    }

    public var stats: DecisionStats {
        DecisionStats(
            total: decisions.count,
            pending: decisions.filter { $0.status == .pending }.count,
            approved: decisions.filter { $0.status == .approved }.count,
            overridden: decisions.filter { $0.status == .overridden }.count,
            escalated: decisions.filter { $0.status == .escalated }.count,
            deferred: decisions.filter { $0.status == .deferred }.count
        )
    }

    // MARK: - Actions

    public func approve(_ id: String) {
        updateStatus(id, to: .approved)
        log(id, action: .approved)
    }

    public func override(_ id: String, reason: String) {
        updateStatus(id, to: .overridden)
        log(id, action: .overridden, reason: reason)
    }

    public func escalate(_ id: String) {
        updateStatus(id, to: .escalated)
        log(id, action: .escalated)
    }

    public func `defer`(_ id: String) {
        updateStatus(id, to: .deferred)
        log(id, action: .deferred)
    }

    public func bulkApprove(_ ids: [String]) {
        for id in ids {
            approve(id)
        }
    }

    // MARK: - Private

    private func updateStatus(_ id: String, to status: DecisionStatus) {
        guard let idx = decisions.firstIndex(where: { $0.id == id }) else { return }
        decisions[idx].status = status
    }

    private func log(_ id: String, action: DecisionStatus, reason: String? = nil) {
        actionLog.append(ActionLogEntry(
            decisionId: id,
            action: action,
            timestamp: Date(),
            reason: reason
        ))
    }
}
