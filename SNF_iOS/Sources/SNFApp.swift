import SwiftUI
import SNFModels
import SNFData
import SNFServices

@main
struct SNFApp: App {
    @State private var engine: DecisionEngine
    @State private var scopeManager: ScopeManager
    @State private var dataProvider: MockDataProvider

    init() {
        let provider = MockDataProvider()
        _dataProvider = State(initialValue: provider)
        _engine = State(initialValue: DecisionEngine(dataProvider: provider))
        _scopeManager = State(initialValue: ScopeManager(dataProvider: provider))
    }

    var body: some Scene {
        WindowGroup {
            ContentView(engine: engine, scopeManager: scopeManager, dataProvider: dataProvider)
        }
    }
}

struct ContentView: View {
    let engine: DecisionEngine
    let scopeManager: ScopeManager
    let dataProvider: MockDataProvider
    @State private var selectedTab = 0
    @State private var isLoaded = false

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Feed", systemImage: "list.bullet.clipboard", value: 0) {
                FeedView(engine: engine, scopeManager: scopeManager)
            }

            Tab("Facilities", systemImage: "building.2", value: 1) {
                FacilitiesView(scopeManager: scopeManager)
            }

            Tab("Agents", systemImage: "cpu", value: 2) {
                AgentsView(dataProvider: dataProvider)
            }
        }
        .task {
            guard !isLoaded else { return }
            do {
                try await scopeManager.load()
                try await engine.load(scope: scopeManager.currentScope)
                isLoaded = true
            } catch {
                print("Load error: \(error)")
            }
        }
    }
}
