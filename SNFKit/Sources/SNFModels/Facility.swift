import Foundation

public struct Facility: Identifiable, Codable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let city: String
    public let state: String
    public let region: String
    public let regionId: String
    public let beds: Int
    public let census: Int
    public let occupancy: Double
    public let healthScore: Int
    public let laborPct: Double
    public let apAging: Int
    public let surveyRisk: SurveyRisk
    public let openIncidents: Int
    public let starRating: Int
    public let lastSurveyDate: String
    public let administrator: String
    public let don: String
    public let phone: String
}
