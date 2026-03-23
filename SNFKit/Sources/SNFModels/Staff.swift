import Foundation

public struct Staff: Identifiable, Codable, Sendable {
    public let id: String
    public let firstName: String
    public let lastName: String
    public let role: String
    public let facilityId: String
    public let department: String
    public let hireDate: String
    public let status: String
    public let shiftPreference: String
    public let certifications: [String]
    public let licenseNumber: String?
    public let licenseExpiry: String?
    public let hourlyRate: Double
    public let isAgency: Bool
    public let phone: String
    public let email: String

    public var fullName: String { "\(firstName) \(lastName)" }
}
