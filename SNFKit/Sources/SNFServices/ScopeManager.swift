import Foundation
import SNFModels
import SNFData

@Observable
@MainActor
public final class ScopeManager {
    public private(set) var currentScope: ScopeType = .enterprise
    public private(set) var regions: [Region] = []
    public private(set) var facilities: [Facility] = []

    private let dataProvider: any DataProvider

    public init(dataProvider: any DataProvider) {
        self.dataProvider = dataProvider
    }

    public func load() async throws {
        regions = try await dataProvider.fetchRegions()
        facilities = try await dataProvider.fetchFacilities()
    }

    public func setScope(_ scope: ScopeType) {
        currentScope = scope
    }

    public var scopeLabel: String {
        switch currentScope {
        case .enterprise:
            "Enterprise"
        case .region(let id):
            regions.first { $0.id == id }?.name ?? "Region"
        case .facility(let id):
            facilities.first { $0.id == id }?.name ?? "Facility"
        }
    }

    public func facilitiesInScope() -> [Facility] {
        switch currentScope {
        case .enterprise:
            return facilities
        case .region(let regionId):
            let region = regions.first { $0.id == regionId }
            let ids = Set(region?.facilityIds ?? [])
            return facilities.filter { ids.contains($0.id) }
        case .facility(let facilityId):
            return facilities.filter { $0.id == facilityId }
        }
    }
}
