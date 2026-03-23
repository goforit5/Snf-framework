import Foundation

public struct Vendor: Identifiable, Codable, Sendable {
    public let id: String
    public let name: String
    public let type: String
    public let category: String
    public let isContracted: Bool
    public let contractId: String?
    public let annualSpend: Int
    public let coiExpiry: String?
    public let w9Status: String
    public let sanctionStatus: String
    public let paymentTerms: String?
    public let primaryContact: String?
    public let phone: String?
    public let email: String?
}
