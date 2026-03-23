import Foundation

public struct EmergencyContact: Codable, Sendable {
    public let name: String
    public let relation: String
    public let phone: String
}

public struct Resident: Identifiable, Codable, Sendable {
    public let id: String
    public let firstName: String
    public let lastName: String
    public let room: String
    public let unit: String
    public let facilityId: String
    public let age: Int
    public let gender: String
    public let admitDate: String
    public let payerType: String
    public let payerId: String
    public let diagnoses: [String]
    public let medications: [String]
    public let riskScore: Int
    public let riskDrivers: [String]
    public let riskTrend: String
    public let carePlanStatus: String
    public let mdsDueDate: String
    public let physicianName: String
    public let allergens: [String]
    public let codeStatus: String
    public let emergencyContact: EmergencyContact

    public var fullName: String { "\(firstName) \(lastName)" }
}
