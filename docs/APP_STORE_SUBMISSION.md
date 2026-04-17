# APP_STORE_SUBMISSION.md

**Project**: SNF Agentic Framework -- Native Companion Apps
**Updated**: 2026-04-14
**Apps**: SNF_iOS (iPhone/iPad), SNF_macOS (Mac)
**Shared Package**: SNFKit (SNFModels, SNFData, SNFServices)

---

## App Store Connect Setup

| Field | iOS App | macOS App |
|---|---|---|
| Bundle ID | `com.taskvisory.snf-ios` | `com.taskvisory.snf-macos` |
| SKU | `SNF-iOS-2026` | `SNF-macOS-2026` |
| Primary Category | Medical | Medical |
| Secondary Category | Business | Business |
| Content Rights | Does not contain third-party content | Does not contain third-party content |
| Availability | Enterprise distribution (recommended) | Enterprise distribution (recommended) |
| Made for Kids | No | No |

---

## Distribution Decision

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **Public App Store** | Discoverable, standard review process | PHI exposure risk, review scrutiny for medical data, requires public privacy policy | Not recommended |
| **Enterprise (ADEP)** | Private, no App Review, direct .ipa distribution | Requires Apple Enterprise Developer Account ($299/yr), Ensign must manage provisioning | Recommended for Ensign |
| **Custom Apps (VPP)** | Private + managed via Apple Business Manager, MDM compatible | Requires Apple Business Manager enrollment, still goes through App Review | Alternative if Ensign uses ABM |
| **TestFlight Only** | Quick iteration, no review for internal builds, up to 10K external testers | 90-day build expiry, not permanent distribution | Development/demo phase |
| **Unlisted App** | Standard review but not searchable, direct link only | Still public technically, requires App Review | Fallback option |

**Recommendation**: Enterprise (ADEP) for production. TestFlight for demo/pitch phase with Ensign leadership.

---

## App Metadata

| Field | iOS Value | macOS Value |
|---|---|---|
| App Name | SNF Command Center | SNF Command Center |
| Subtitle | Agentic Healthcare Intelligence | Agentic Healthcare Intelligence |
| Description | AI-powered command center for skilled nursing facility operations. Review agent decisions, monitor 330+ facilities, track autonomous agent activity across clinical, financial, workforce, and compliance domains. Human-in-the-loop governance at every level. | AI-powered command center for skilled nursing facility operations. Three-column Mac interface for reviewing agent decisions, monitoring facility health scores, tracking autonomous agents, and auditing the complete decision chain. Keyboard-navigable with vim-style shortcuts. |
| Promotional Text | Enterprise agentic AI for healthcare operations -- one person per department handles all HITL decisions | Enterprise agentic AI for healthcare operations -- full three-column command center |
| Keywords | `healthcare, SNF, nursing, AI, agents, decisions, clinical, compliance, HIPAA, governance` | `healthcare, SNF, nursing, AI, agents, decisions, clinical, compliance, HIPAA, governance` |
| Age Rating | 17+ (medical/treatment information) | 17+ (medical/treatment information) |
| Price | Free (enterprise deployment) | Free (enterprise deployment) |
| Copyright | 2026 Taskvisory LLC | 2026 Taskvisory LLC |
| Support URL | `https://taskvisory.com/support` | `https://taskvisory.com/support` |

---

## Screenshots Required

### iOS

| Device | Size (pixels) | Count | Scenes |
|---|---|---|---|
| iPhone 16 Pro Max (6.9") | 1320x2868 | 5 | Feed (decision list), Facility grid, Agent grid, Decision detail sheet, Dark mode feed |
| iPhone 16 Pro (6.3") | 1206x2622 | 5 | Same scenes |
| iPad Pro 13" (M4) | 2064x2752 | 5 | Feed landscape, Facility detail sheet, Agent detail sheet, Decision swipe actions, Stats header |

### macOS

| Device | Size (pixels) | Count | Scenes |
|---|---|---|---|
| Mac (Retina) | 2880x1800 | 5 | Today briefing, Decisions list + detail, Facilities grid + detail, Agents grid + detail, Audit trail + trace chain |

### Screenshot Capture Notes

- All screenshots in dark mode (macOS app uses `.preferredColorScheme(.dark)`)
- iOS screenshots should show both light and dark variants
- Use mock data (already loaded via `MockDataProvider`)
- Show populated decision queues with all priority levels (critical, high, medium, low)
- Facility cards should show health scores, star ratings, occupancy
- Agent cards should show active/inactive status, domain badges, governance levels

---

## Privacy Nutrition Labels

Reference: `docs/PRIVACY_MANIFEST.md` section "Native App Privacy (SNFKit)" and "PHI Field Inventory"

### Data Collected (Production Mode)

| Data Type | Collected | Linked to Identity | Used for Tracking | Purpose |
|---|---|---|---|---|
| Health Records (PHI) | Yes (via PCC API) | Yes | No | App Functionality |
| Name (resident) | Yes (via PCC API) | Yes | No | App Functionality |
| Name (employee) | Yes (via Workday API) | Yes | No | App Functionality |
| Contact Info (employee) | Yes (via Workday API) | Yes | No | App Functionality |
| Financial Info (compensation) | Yes (via Workday API) | Yes | No | App Functionality |
| Identifiers (facility IDs, agent IDs) | Yes | No | No | App Functionality |
| Diagnostics (crash logs) | Planned | No | No | App Functionality |

### Data NOT Collected

| Data Type | Status |
|---|---|
| Location | Not collected |
| Contacts | Not collected |
| Search History | Not collected |
| Browsing History | Not collected |
| Purchases | Not collected |
| Advertising Data | Not collected |
| Usage Data (analytics) | Not collected |
| IDFA / Advertising Identifier | Not collected |

### Apple Privacy Manifest (PrivacyInfo.xcprivacy)

| Key | Value |
|---|---|
| `NSPrivacyTracking` | `false` |
| `NSPrivacyTrackingDomains` | `[]` (empty) |
| `NSPrivacyCollectedDataTypes` | Health, Name, Contact Info, Identifiers |
| `NSPrivacyAccessedAPITypes` | None (no required reason APIs used) |

---

## Privacy Policy

| Requirement | Status | Notes |
|---|---|---|
| Privacy Policy URL | Planned | Must be hosted at `https://taskvisory.com/privacy/snf` |
| PHI Disclosure | Required | How PHI is accessed from PCC, processed in-memory by agents, persisted as decision evidence |
| PII Disclosure | Required | How employee data flows from Workday through agent processing |
| Third-Party Processors | Required | Anthropic (Claude API), AWS (Bedrock), PCC, Workday, Microsoft |
| Data Retention | Required | 6-year HIPAA retention for audit trail and decision queue; M365 data not persisted |
| User Rights | Required | Right of access, amendment, accounting of disclosures (HIPAA 164.524/526/528) |
| Data Encryption | Required | TLS 1.3 in transit, PostgreSQL TDE at rest, AWS KMS |
| Breach Notification | Required | HHS within 60 days, state AG per state law, individuals per HIPAA 164.404 |
| HIPAA Compliance Statement | Required | BAA-covered processing via AWS Bedrock in Ensign VPC |

---

## App Review Information

| Field | Value |
|---|---|
| Demo Account Username | `reviewer@snf-demo.taskvisory.com` |
| Demo Account Password | (generate unique password per submission) |
| Special Instructions | Healthcare enterprise app for skilled nursing facility operations. Review version uses mock data only -- no live PHI. Production deployment connects to PCC (EHR), Workday (HR), and Microsoft 365 via MCP connectors within customer VPC. |
| Notes for Reviewer | App requires enterprise deployment for PHI access. All data shown in review build is synthetic mock data generated from `SNFKit/SNFData/MockData`. No network calls to external healthcare systems in demo mode. |
| Contact Name | Andrew |
| Contact Phone | (provide before submission) |
| Contact Email | andrew@taskvisory.com |

---

## Technical Requirements

| Requirement | iOS | macOS | Status |
|---|---|---|---|
| Minimum OS | iOS 26 | macOS 26 | Shipped |
| Swift Version | 6.2 | 6.2 | Shipped |
| Swift Concurrency | `@MainActor`, `@Observable`, `Sendable` | `@MainActor`, `@Observable`, `Sendable` | Shipped |
| SwiftUI | Yes (full SwiftUI, no UIKit) | Yes (full SwiftUI, no AppKit) | Shipped |
| Package Manager | Swift Package Manager | Swift Package Manager | Shipped |
| Dark Mode | Supported (system + manual) | Default dark (`.preferredColorScheme(.dark)`) | Shipped |
| Accessibility (VoiceOver) | Planned | Planned | Planned |
| Accessibility (Dynamic Type) | Planned | N/A | Planned |
| Landscape Support | iPad only | Full window management | Shipped |
| Keyboard Navigation | N/A | vim-style (j/k/a/e/d) in DecisionsView | Shipped |
| Haptic Feedback | `.sensoryFeedback(.success)` on approve | N/A | Shipped |
| Pull to Refresh | `.refreshable` on FeedView | N/A | Shipped |
| Glass Effect | `.glassEffect(.regular)` on all cards | `.glassEffect(.regular.interactive())` on all cards | Shipped |

---

## App Architecture

### iOS (SNF_iOS)

| Component | File | Purpose |
|---|---|---|
| App Entry | `Sources/SNFApp.swift` | `@main`, TabView with 3 tabs (Feed, Facilities, Agents) |
| Feed Tab | `Sources/FeedView.swift` | Decision list grouped by priority, swipe actions (approve/override/escalate/defer) |
| Facilities Tab | `Sources/FacilitiesView.swift` | 2-column LazyVGrid of facility cards, sheet detail |
| Agents Tab | `Sources/AgentsView.swift` | 2-column LazyVGrid of agent cards, sheet detail |
| Decision Detail | `Sources/DecisionDetailSheet.swift` | Full decision sheet with recommendation, impact, evidence, policies, action bar |
| Shared UI | `Sources/Helpers.swift` | GovernanceBadge, DomainBadge, PriorityBadge, ConfidenceGauge |

### macOS (SNF_macOS)

| Component | File | Purpose |
|---|---|---|
| App Entry | `Sources/SNFApp.swift` | `@main`, 3-column NavigationSplitView (sidebar/content/detail) |
| Sidebar | `Sources/Sidebar.swift` | 5 tabs: Today, Decisions, Facilities, Agents, Audit |
| Scope Selector | `Sources/ScopeSelector.swift` | Enterprise/region/facility scope picker in sidebar footer |
| Today | `Sources/TodayView.swift` | Morning briefing, stats, top decisions, facility health grid |
| Decisions | `Sources/DecisionsView.swift` | Domain filter chips, bulk approve, keyboard nav (j/k/a/e/d) |
| Decision Detail | `Sources/DecisionDetailView.swift` | Full detail with override sheet |
| Facilities | `Sources/FacilitiesView.swift` | Adaptive grid with survey risk indicators |
| Facility Detail | `Sources/FacilityDetailView.swift` | Metrics grid, operations, leadership contact |
| Agents | `Sources/AgentsView.swift` | Stats bar, domain filter, adaptive grid |
| Agent Detail | `Sources/AgentDetailView.swift` | Status, metrics, policies enforced, triggers |
| Audit | `Sources/AuditView.swift` | Actor type filter (agent/human), timestamped list |
| Audit Detail | `Sources/AuditDetailView.swift` | Disposition, evidence, policies, trace chain timeline |
| Shared UI | `Sources/Helpers.swift` | PriorityBadge, DomainBadge, GovernanceBadge, StatusBadge, StarRating, StatCard |

### Shared Package (SNFKit)

| Library | Path | Contents |
|---|---|---|
| SNFModels | `SNFKit/Sources/SNFModels/` | Decision, Facility, Agent, AuditEntry models; Enums (DecisionStatus, Priority, GovernanceLevel, Domain, ScopeType, SurveyRisk, ActorType) |
| SNFData | `SNFKit/Sources/SNFData/` | MockDataProvider, DataProvider protocol, JSON mock data resources |
| SNFServices | `SNFKit/Sources/SNFServices/` | DecisionEngine (state machine: approve/override/escalate/defer), ScopeManager, BriefingEngine, Theme (color/icon extensions) |

---

## Entitlements

| Entitlement | iOS | macOS | Purpose |
|---|---|---|---|
| `com.apple.security.network.client` | Yes | Yes | HTTPS to platform API |
| `com.apple.security.app-sandbox` | N/A | Yes | macOS sandbox requirement |
| Background App Refresh | Planned | N/A | Decision queue polling |
| Push Notifications (APNs) | Planned | Planned | Decision alert delivery |
| Keychain Sharing | Planned | Planned | OAuth token storage across app group |
| Face ID / Touch ID | Planned | Planned | Local authentication for app access |

---

## App Store Guidelines Compliance

| Guideline | Section | Status | Notes |
|---|---|---|---|
| 1.1 Objectionable Content | Safety | Compliant | Healthcare operational data only |
| 2.1 App Completeness | Performance | Compliant | Functional with mock data; all views populated |
| 2.3.3 Screenshots | Performance | Planned | Need to capture from simulator/device |
| 2.3.7 Accurate Metadata | Performance | Compliant | Description matches functionality |
| 2.5.1 Only Public APIs | Performance | Compliant | SwiftUI + Foundation only; no private API usage |
| 3.1.1 In-App Purchase | Business | N/A | Free app, no IAP |
| 4.0 Design (HIG) | Design | Compliant | Full SwiftUI, system components, SF Symbols, glass effects |
| 4.1 Copycats | Design | Compliant | Original application; no copied UI |
| 4.2 Minimum Functionality | Design | Compliant | Full decision queue, 330+ facility browser, agent monitoring, audit trail, scope management |
| 4.7 HTML5 Games/Apps | Design | N/A | Native SwiftUI |
| 5.1.1 Data Collection | Legal/Privacy | Compliant | Privacy nutrition labels documented; no tracking |
| 5.1.2 Data Use and Sharing | Legal/Privacy | Compliant | PHI used only for app functionality; no third-party sharing beyond Anthropic/AWS (BAA-covered) |
| 5.1.3 Health and Health Research | Legal/Privacy | Review needed | App displays clinical decisions from PCC; may trigger additional review |
| 5.3 Gaming, Gambling | Legal | N/A | Not applicable |
| 27.0 Healthcare Apps | Health | Review needed | Displays clinical decision support; not a diagnostic tool. May require additional documentation for medical data handling |
| 27.1 Health Records | Health | Review needed | Accesses PCC health records via MCP connectors; HealthKit not used |

### Guideline 27.0 Risk Mitigation

- App does not diagnose, treat, or provide medical advice
- AI agents make recommendations; humans approve/override/escalate/defer
- All decisions audited with immutable hash chain
- HIPAA compliance architecture documented in `docs/PRIVACY_MANIFEST.md`
- PHI processing occurs server-side in Ensign VPC; app receives decision summaries
- Mock data mode for review eliminates PHI exposure during App Review

---

## Featuring Nomination Readiness

| Criterion | Status | Notes |
|---|---|---|
| Uses latest OS features | Yes | iOS 26/macOS 26, `.glassEffect()`, `@Observable`, Swift 6.2 concurrency |
| SwiftUI native | Yes | 100% SwiftUI, zero UIKit/AppKit |
| Accessibility | Planned | VoiceOver labels, Dynamic Type scaling |
| Dark mode | Shipped | System preference detection + manual toggle |
| Unique use case | Yes | Agentic AI for healthcare operations; no comparable App Store product |
| iPad optimization | Yes | 2-column grid, sheet presentations |
| Mac optimization | Yes | 3-column NavigationSplitView, keyboard navigation, scope selector |
| Widget support | Planned | Decision count widget, facility health widget |
| Live Activities | Planned | Active critical decision count |

---

## Phased Release Plan

| Phase | Distribution | Duration | Gate |
|---|---|---|---|
| 1. Internal testing | TestFlight (internal) | 1 week | All views render, mock data loads, actions dispatch correctly |
| 2. Ensign demo | TestFlight (external, Ensign contacts) | 2 weeks | Barry/CTO team feedback incorporated |
| 3. Enterprise pilot | Enterprise (ADEP) or Custom Apps (VPP) | 2 weeks | Ensign IT approval, MDM enrollment, credentials provided |
| 4. Production | Enterprise (ADEP) | Ongoing | Live PCC/Workday/M365 data flowing, monitoring active |

---

## Build & Signing Checklist

| Step | iOS | macOS | Notes |
|---|---|---|---|
| Apple Developer Program enrollment | Required | Required | $99/yr (or $299/yr for Enterprise) |
| Certificates (Distribution) | Create in Xcode | Create in Xcode | Separate for iOS and macOS |
| Provisioning Profiles | App Store / Enterprise | Developer ID / Enterprise | Match bundle IDs |
| App Icons | Required (1024x1024 single asset) | Required (1024x1024 single asset) | No alpha channel |
| Launch Screen | SwiftUI default | N/A | No custom storyboard needed |
| Xcode Archive | `Product > Archive` | `Product > Archive` | Swift Package Manager resolves SNFKit |
| App Store Connect upload | Xcode Organizer or `xcrun altool` | Xcode Organizer or `xcrun altool` | Validate before upload |
| Export Compliance | No encryption above standard HTTPS | No encryption above standard HTTPS | Exempt from ECCN requirements |

---

## Post-Submission Checklist

| Step | Action | Notes |
|---|---|---|
| Monitor review status | Check App Store Connect daily | 24-48hr typical for initial review |
| Respond to reviewer questions | Within 24hr | Have mock credentials and demo walkthrough ready |
| Guideline 27.0 response | Prepare healthcare documentation package | HIPAA compliance summary, BAA strategy, PHI handling architecture |
| Check crash reports | Xcode Organizer + App Store Connect | First 48hr critical window |
| Monitor TestFlight feedback | TestFlight app | Collect Ensign team feedback |
| Version increment | Bump in Package.swift if resubmission needed | Swift packages use git tags for versioning |

---

## Key File References

| File | Path (from project root) |
|---|---|
| iOS app manifest | `SNF_iOS/Package.swift` |
| macOS app manifest | `SNF_macOS/Package.swift` |
| Shared package manifest | `SNFKit/Package.swift` |
| Domain enums | `SNFKit/Sources/SNFModels/Enums.swift` |
| Theme / colors | `SNFKit/Sources/SNFServices/Theme.swift` |
| Decision engine | `SNFKit/Sources/SNFServices/DecisionEngine.swift` |
| Privacy manifest | `docs/PRIVACY_MANIFEST.md` |
| Security architecture | `docs/SECURITY_ARCHITECTURE.md` |
| API contract | `docs/API_CONTRACT.md` |
