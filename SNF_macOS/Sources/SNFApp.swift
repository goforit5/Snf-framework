import SwiftUI
import SNFModels
import SNFData
import SNFServices

@main
struct SNFApp: App {
    @State private var decisionEngine: DecisionEngine
    @State private var scopeManager: ScopeManager
    @State private var dataProvider: MockDataProvider
    @State private var selectedTab: SidebarTab = .today
    @State private var selectedDecisionId: String?
    @State private var selectedFacilityId: String?
    @State private var selectedAgentId: String?
    @State private var selectedAuditId: String?
    @State private var columnVisibility: NavigationSplitViewVisibility = .doubleColumn

    init() {
        let provider = MockDataProvider()
        self.dataProvider = provider
        self.decisionEngine = DecisionEngine(dataProvider: provider)
        self.scopeManager = ScopeManager(dataProvider: provider)
    }

    private var hasDetailSelection: Bool {
        switch selectedTab {
        case .today, .decisions: selectedDecisionId != nil
        case .facilities: selectedFacilityId != nil
        case .agents: selectedAgentId != nil
        case .audit: selectedAuditId != nil
        }
    }

    var body: some Scene {
        WindowGroup("SNF Command Center") {
            NavigationSplitView(columnVisibility: $columnVisibility) {
                Sidebar(
                    selectedTab: $selectedTab,
                    scopeManager: scopeManager
                )
                .navigationSplitViewColumnWidth(min: 200, ideal: 220, max: 260)
            } content: {
                Group {
                    switch selectedTab {
                    case .today:
                        TodayView(
                            decisionEngine: decisionEngine,
                            scopeManager: scopeManager,
                            selectedDecisionId: $selectedDecisionId,
                            selectedFacilityId: $selectedFacilityId,
                            navigateToDecisions: { selectedTab = .decisions },
                            navigateToFacilities: { selectedTab = .facilities }
                        )
                    case .decisions:
                        DecisionsView(
                            decisionEngine: decisionEngine,
                            selectedDecisionId: $selectedDecisionId
                        )
                    case .facilities:
                        FacilitiesView(
                            scopeManager: scopeManager,
                            selectedFacilityId: $selectedFacilityId
                        )
                    case .agents:
                        AgentsView(
                            dataProvider: dataProvider,
                            selectedAgentId: $selectedAgentId
                        )
                    case .audit:
                        AuditView(
                            dataProvider: dataProvider,
                            selectedAuditId: $selectedAuditId
                        )
                    }
                }
                .navigationSplitViewColumnWidth(min: 400, ideal: 500, max: .infinity)
            } detail: {
                Group {
                    switch selectedTab {
                    case .today, .decisions:
                        if let id = selectedDecisionId,
                           let decision = decisionEngine.decisions.first(where: { $0.id == id }) {
                            DecisionDetailView(
                                decision: decision,
                                decisionEngine: decisionEngine
                            )
                        }
                    case .facilities:
                        if let id = selectedFacilityId,
                           let facility = scopeManager.facilities.first(where: { $0.id == id }) {
                            FacilityDetailView(facility: facility)
                        }
                    case .agents:
                        if let id = selectedAgentId,
                           let agent = agents.first(where: { $0.id == id }) {
                            AgentDetailView(agent: agent)
                        }
                    case .audit:
                        if let id = selectedAuditId,
                           let entry = auditEntries.first(where: { $0.id == id }) {
                            AuditDetailView(
                                entry: entry,
                                allEntries: auditEntries
                            )
                        }
                    }
                }
                .navigationSplitViewColumnWidth(min: 320, ideal: 400, max: 500)
            }
            .onChange(of: hasDetailSelection) {
                withAnimation {
                    columnVisibility = hasDetailSelection ? .all : .doubleColumn
                }
            }
            .onChange(of: selectedTab) { oldTab, newTab in
                // Only clear selections for tabs we're NOT navigating to
                if newTab != .today && newTab != .decisions {
                    selectedDecisionId = nil
                }
                if newTab != .facilities {
                    selectedFacilityId = nil
                }
                if newTab != .agents {
                    selectedAgentId = nil
                }
                if newTab != .audit {
                    selectedAuditId = nil
                }
            }
            .task {
                await loadData()
            }
            .onChange(of: scopeManager.currentScope) {
                Task { await reloadDecisions() }
            }
            .preferredColorScheme(.dark)
        }
        .windowStyle(.automatic)
    }

    @State private var agents: [Agent] = []
    @State private var auditEntries: [AuditEntry] = []

    private func loadData() async {
        do {
            try await scopeManager.load()
            try await decisionEngine.load(scope: scopeManager.currentScope)
            agents = try await dataProvider.fetchAgents()
            auditEntries = try await dataProvider.fetchAuditLog(traceId: nil)
        } catch {
            print("Failed to load data: \(error)")
        }
    }

    private func reloadDecisions() async {
        do {
            try await decisionEngine.load(scope: scopeManager.currentScope)
        } catch {
            print("Failed to reload decisions: \(error)")
        }
    }
}
