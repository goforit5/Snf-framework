import Testing
import Foundation
@testable import SNFModels
@testable import SNFData

@Suite("Model Decoding")
struct ModelDecodingTests {
    let provider = MockDataProvider()

    @Test("Facilities decode — 8 items")
    func facilitiesDecode() async throws {
        let items = try await provider.fetchFacilities()
        #expect(items.count == 8)
        #expect(items[0].id == "f1")
        #expect(items[0].name == "Phoenix Sunrise")
        #expect(items[0].beds == 120)
    }

    @Test("Residents decode — 59 items")
    func residentsDecode() async throws {
        let items = try await provider.fetchResidents(facilityId: nil)
        #expect(items.count == 59)
        #expect(items[0].firstName == "Margaret")
        #expect(items[0].lastName == "Chen")
    }

    @Test("Staff decode — 118 items")
    func staffDecode() async throws {
        let items = try await provider.fetchStaff(facilityId: nil)
        #expect(items.count == 118)
        #expect(items[0].id == "staff1")
    }

    @Test("Decisions decode — 53 items")
    func decisionsDecode() async throws {
        let items = try await provider.fetchDecisions(scope: .enterprise)
        #expect(items.count == 53)
        #expect(items[0].id == "dec-001")
        #expect(items[0].priority == .critical)
        #expect(items[0].domain == .clinical)
        #expect(items[0].governanceLevel == .review)
    }

    @Test("Agents decode — 30 items")
    func agentsDecode() async throws {
        let items = try await provider.fetchAgents()
        #expect(items.count == 30)
        #expect(items[0].id == "clinical-monitor")
        #expect(items[0].domain == .clinical)
    }

    @Test("Vendors decode — 32 items")
    func vendorsDecode() async throws {
        let items = try await provider.fetchVendors()
        #expect(items.count == 32)
        #expect(items[0].name == "Sysco Foods")
    }

    @Test("Payers decode — 16 items")
    func payersDecode() async throws {
        let items = try await provider.fetchPayers()
        #expect(items.count == 16)
        #expect(items[0].name == "Medicare Part A")
    }

    @Test("Regions decode — 3 items")
    func regionsDecode() async throws {
        let items = try await provider.fetchRegions()
        #expect(items.count == 3)
        #expect(items[0].name == "Southwest")
        #expect(items[0].facilityIds.count == 3)
    }

    @Test("Audit log decodes — 518 items")
    func auditLogDecodes() async throws {
        let items = try await provider.fetchAuditLog(traceId: nil)
        #expect(items.count == 518)
    }

    @Test("Scope filtering — facility")
    func facilityScope() async throws {
        let items = try await provider.fetchDecisions(scope: .facility("f1"))
        #expect(items.allSatisfy { $0.facilityId == "f1" || $0.facilityId == "all" })
    }

    @Test("Scope filtering — region")
    func regionScope() async throws {
        let items = try await provider.fetchDecisions(scope: .region("r1"))
        let validIds: Set<String> = ["f1", "f4", "f8", "all"]
        #expect(items.allSatisfy { validIds.contains($0.facilityId) })
    }

    @Test("Audit trace filtering")
    func auditTraceFilter() async throws {
        let items = try await provider.fetchAuditLog(traceId: "TRACE-MCF-001")
        #expect(items.count == 10)
        #expect(items.allSatisfy { $0.traceId == "TRACE-MCF-001" })
    }
}
