import Foundation
import SNFModels

public protocol DataProvider: Sendable {
    func fetchFacilities() async throws -> [Facility]
    func fetchResidents(facilityId: String?) async throws -> [Resident]
    func fetchStaff(facilityId: String?) async throws -> [Staff]
    func fetchDecisions(scope: ScopeType) async throws -> [Decision]
    func fetchAgents() async throws -> [Agent]
    func fetchVendors() async throws -> [Vendor]
    func fetchPayers() async throws -> [Payer]
    func fetchRegions() async throws -> [Region]
    func fetchAuditLog(traceId: String?) async throws -> [AuditEntry]
}
