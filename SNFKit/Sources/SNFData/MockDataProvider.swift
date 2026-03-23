import Foundation
import SNFModels

public final class MockDataProvider: DataProvider, @unchecked Sendable {
    private var facilities: [Facility] = []
    private var residents: [Resident] = []
    private var staffMembers: [Staff] = []
    private var decisions: [Decision] = []
    private var agents: [Agent] = []
    private var vendors: [Vendor] = []
    private var payers: [Payer] = []
    private var regions: [Region] = []
    private var auditEntries: [AuditEntry] = []
    private var loaded = false

    public init() {}

    private func loadIfNeeded() throws {
        guard !loaded else { return }
        let decoder = JSONDecoder()

        facilities = try loadJSON("facilities", decoder: decoder)
        residents = try loadJSON("residents", decoder: decoder)
        staffMembers = try loadJSON("staff", decoder: decoder)
        decisions = try loadJSON("decisions", decoder: decoder)
        agents = try loadJSON("agents", decoder: decoder)
        vendors = try loadJSON("vendors", decoder: decoder)
        payers = try loadJSON("payers", decoder: decoder)
        regions = try loadJSON("regions", decoder: decoder)
        auditEntries = try loadJSON("auditLog", decoder: decoder)
        loaded = true
    }

    private func loadJSON<T: Decodable>(_ name: String, decoder: JSONDecoder) throws -> [T] {
        guard let url = Bundle.module.url(forResource: name, withExtension: "json") else {
            throw MockDataError.fileNotFound(name)
        }
        let data = try Data(contentsOf: url)
        return try decoder.decode([T].self, from: data)
    }

    // MARK: - DataProvider

    public func fetchFacilities() async throws -> [Facility] {
        try loadIfNeeded()
        return facilities
    }

    public func fetchResidents(facilityId: String?) async throws -> [Resident] {
        try loadIfNeeded()
        guard let facilityId else { return residents }
        return residents.filter { $0.facilityId == facilityId }
    }

    public func fetchStaff(facilityId: String?) async throws -> [Staff] {
        try loadIfNeeded()
        guard let facilityId else { return staffMembers }
        return staffMembers.filter { $0.facilityId == facilityId }
    }

    public func fetchDecisions(scope: ScopeType) async throws -> [Decision] {
        try loadIfNeeded()
        switch scope {
        case .enterprise:
            return decisions
        case .region(let regionId):
            let region = regions.first { $0.id == regionId }
            let facilityIds = Set(region?.facilityIds ?? [])
            return decisions.filter { facilityIds.contains($0.facilityId) || $0.facilityId == "all" }
        case .facility(let facilityId):
            return decisions.filter { $0.facilityId == facilityId || $0.facilityId == "all" }
        }
    }

    public func fetchAgents() async throws -> [Agent] {
        try loadIfNeeded()
        return agents
    }

    public func fetchVendors() async throws -> [Vendor] {
        try loadIfNeeded()
        return vendors
    }

    public func fetchPayers() async throws -> [Payer] {
        try loadIfNeeded()
        return payers
    }

    public func fetchRegions() async throws -> [Region] {
        try loadIfNeeded()
        return regions
    }

    public func fetchAuditLog(traceId: String?) async throws -> [AuditEntry] {
        try loadIfNeeded()
        guard let traceId else { return auditEntries }
        return auditEntries.filter { $0.traceId == traceId }
    }
}

public enum MockDataError: Error, LocalizedError {
    case fileNotFound(String)

    public var errorDescription: String? {
        switch self {
        case .fileNotFound(let name):
            "Mock data file '\(name).json' not found in bundle"
        }
    }
}
