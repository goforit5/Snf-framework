import SwiftUI
import SNFModels
import SNFServices

struct ScopeSelector: View {
    var scopeManager: ScopeManager
    @State private var selection: String = "enterprise"

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SCOPE")
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)

            Picker("Scope", selection: $selection) {
                Text("Enterprise").tag("enterprise")

                if !scopeManager.regions.isEmpty {
                    Divider()
                    ForEach(scopeManager.regions) { region in
                        Text(region.name).tag("region:\(region.id)")
                    }
                }

                if !scopeManager.facilities.isEmpty {
                    Divider()
                    ForEach(scopeManager.facilities) { facility in
                        Text(facility.name).tag("facility:\(facility.id)")
                    }
                }
            }
            .labelsHidden()
            .onChange(of: selection) { _, newValue in
                if newValue == "enterprise" {
                    scopeManager.setScope(.enterprise)
                } else if newValue.hasPrefix("region:") {
                    let id = String(newValue.dropFirst(7))
                    scopeManager.setScope(.region(id))
                } else if newValue.hasPrefix("facility:") {
                    let id = String(newValue.dropFirst(9))
                    scopeManager.setScope(.facility(id))
                }
            }
        }
    }
}
