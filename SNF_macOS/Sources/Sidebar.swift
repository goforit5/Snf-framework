import SwiftUI
import SNFModels
import SNFServices

enum SidebarTab: String, CaseIterable, Identifiable {
    case today = "Today"
    case decisions = "Decisions"
    case facilities = "Facilities"
    case agents = "Agents"
    case audit = "Audit"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .today: "house.fill"
        case .decisions: "checkmark.circle"
        case .facilities: "building.2"
        case .agents: "cpu"
        case .audit: "shield.checkered"
        }
    }
}

struct Sidebar: View {
    @Binding var selectedTab: SidebarTab
    var scopeManager: ScopeManager

    var body: some View {
        List(selection: $selectedTab) {
            Section("Command Center") {
                ForEach(SidebarTab.allCases) { tab in
                    Label(tab.rawValue, systemImage: tab.icon)
                        .tag(tab)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            ScopeSelector(scopeManager: scopeManager)
                .padding()
        }
        .navigationTitle("SNF")
    }
}
