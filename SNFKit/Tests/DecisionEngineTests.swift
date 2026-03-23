import Testing
import Foundation
@testable import SNFModels
@testable import SNFData
@testable import SNFServices

@Suite("Decision Engine")
struct DecisionEngineTests {
    @Test("Approve transitions status")
    @MainActor
    func approveTransition() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)
        let id = engine.decisions[0].id

        engine.approve(id)

        #expect(engine.decisions.first { $0.id == id }?.status == .approved)
        #expect(engine.actionLog.count == 1)
        #expect(engine.actionLog[0].action == .approved)
    }

    @Test("Override transitions with reason")
    @MainActor
    func overrideTransition() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)
        let id = engine.decisions[0].id

        engine.override(id, reason: "Cost too high")

        #expect(engine.decisions.first { $0.id == id }?.status == .overridden)
        #expect(engine.actionLog[0].reason == "Cost too high")
    }

    @Test("Escalate transitions status")
    @MainActor
    func escalateTransition() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)
        let id = engine.decisions[0].id

        engine.escalate(id)

        #expect(engine.decisions.first { $0.id == id }?.status == .escalated)
    }

    @Test("Defer transitions status")
    @MainActor
    func deferTransition() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)
        let id = engine.decisions[0].id

        engine.defer(id)

        #expect(engine.decisions.first { $0.id == id }?.status == .deferred)
    }

    @Test("Bulk approve multiple decisions")
    @MainActor
    func bulkApprove() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)
        let ids = Array(engine.decisions.prefix(5).map(\.id))

        engine.bulkApprove(ids)

        for id in ids {
            #expect(engine.decisions.first { $0.id == id }?.status == .approved)
        }
        #expect(engine.actionLog.count == 5)
    }

    @Test("Pending filters correctly")
    @MainActor
    func pendingFilter() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)
        let initial = engine.pending.count

        engine.approve(engine.decisions[0].id)

        #expect(engine.pending.count == initial - 1)
    }

    @Test("Stats compute correctly")
    @MainActor
    func statsCompute() async throws {
        let engine = DecisionEngine(dataProvider: MockDataProvider())
        try await engine.load(scope: .enterprise)

        let approvedBefore = engine.stats.approved
        let pendingBefore = engine.stats.pending

        engine.approve(engine.pending[0].id)
        engine.escalate(engine.pending[0].id)

        #expect(engine.stats.approved == approvedBefore + 1)
        #expect(engine.stats.escalated == 1)
        #expect(engine.stats.pending == pendingBefore - 2)
        #expect(engine.stats.total == engine.decisions.count)
    }
}
