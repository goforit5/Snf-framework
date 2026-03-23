import Foundation

public struct Payer: Identifiable, Codable, Sendable {
    public let id: String
    public let name: String
    public let type: String
    public let avgDailyRate: Int
    public let avgLOS: Int
    public let authRequired: Bool
    public let timelyFilingDays: Int?
    public let denialRate: Double
    public let contactPhone: String?
}
