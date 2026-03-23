import Foundation

public struct RegionMetrics: Codable, Sendable {
    public let totalBeds: Int
    public let totalCensus: Int
    public let avgOccupancy: Double
    public let avgHealthScore: Double
}

public struct Region: Identifiable, Codable, Sendable {
    public let id: String
    public let name: String
    public let director: String
    public let facilityIds: [String]
    public let metrics: RegionMetrics
}
