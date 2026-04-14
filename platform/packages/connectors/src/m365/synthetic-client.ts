/**
 * M365 Synthetic Client — returns realistic email/calendar/SharePoint data for demo/staging.
 *
 * Deterministic: same input always produces the same output.
 * Activated via CONNECTOR_MODE=synthetic environment variable.
 */

import type {
  M365Email,
  M365CalendarEvent,
  M365SharePointFile,
} from './types.js';

import {
  DEMO_FACILITIES,
  pick,
  seedHash,
  seededInt,
  daysAgo,
} from '../synthetic/seed-data.js';

// ---------------------------------------------------------------------------
// Email Pool
// ---------------------------------------------------------------------------

const EMAIL_TEMPLATES: readonly { subject: string; from: string; fromName: string; preview: string; importance: M365Email['importance']; categories: string[] }[] = [
  { subject: 'Q1 2026 Staffing Analysis — {facility}', from: 'david.hernandez@ensigngroup.net', fromName: 'David Hernandez', preview: 'Attached is the Q1 staffing analysis. Key findings: RN vacancy rate improved from 8.2% to 4.1%...', importance: 'normal', categories: ['Staffing', 'Reports'] },
  { subject: 'URGENT: CMS Survey Scheduled — {facility}', from: 'compliance@ensigngroup.net', fromName: 'Compliance Team', preview: 'CMS survey team arriving tomorrow morning. All departments on alert. Ensure all documentation is current.', importance: 'high', categories: ['Compliance', 'Survey'] },
  { subject: 'Monthly Quality Metrics — {facility}', from: 'quality@ensigngroup.net', fromName: 'Quality Department', preview: 'Monthly quality dashboard attached. Falls rate decreased 15% from previous month. Infection rates stable.', importance: 'normal', categories: ['Quality', 'Reports'] },
  { subject: 'RE: Physician Coverage — Weekend {facility}', from: 'medical.staff@ensigngroup.net', fromName: 'Medical Staff Office', preview: 'Dr. Patel confirmed for weekend coverage. Rounding times: Saturday 9am, Sunday 10am. On-call through Monday 7am.', importance: 'normal', categories: ['Medical Staff'] },
  { subject: 'Budget Variance Report — March 2026', from: 'finance@ensigngroup.net', fromName: 'Finance Department', preview: 'March budget variance summary: Revenue 2.3% above target, labor costs 1.8% over budget due to agency usage.', importance: 'normal', categories: ['Finance', 'Reports'] },
  { subject: 'ACTION REQUIRED: Credentialing Expiry Notices', from: 'hr@ensigngroup.net', fromName: 'HR Department', preview: '5 employees have credentials expiring within 30 days. Please ensure renewals are submitted immediately.', importance: 'high', categories: ['HR', 'Compliance'] },
  { subject: 'Family Council Meeting Notes — March', from: 'social.services@ensigngroup.net', fromName: 'Social Services', preview: 'Summary of March family council meeting. Key topics: visitation policy update, activity calendar, dining menu rotation.', importance: 'low', categories: ['Social Services'] },
  { subject: 'Incident Report Follow-Up — Fall Prevention', from: 'risk@ensigngroup.net', fromName: 'Risk Management', preview: 'Review of Q1 fall incidents complete. Root cause analysis shows 60% occurred during transfer. Recommending additional training.', importance: 'normal', categories: ['Risk Management', 'Quality'] },
  { subject: 'RE: New Admission — Medicare Part A', from: 'admissions@ensigngroup.net', fromName: 'Admissions Department', preview: 'New admission approved for Room 204B. Medicare Part A, hip fracture rehab. Expected LOS 20 days. Pre-admission assessment complete.', importance: 'normal', categories: ['Admissions'] },
  { subject: 'Weekly Regional Ops Summary — Southwest', from: 'david.hernandez@ensigngroup.net', fromName: 'David Hernandez', preview: 'Weekly summary: Average occupancy 91.2%, census gains at 3 facilities, 2 survey-free months. Agency spend trending down.', importance: 'normal', categories: ['Operations', 'Regional'] },
];

// ---------------------------------------------------------------------------
// Calendar Event Pool
// ---------------------------------------------------------------------------

const CALENDAR_TEMPLATES: readonly { subject: string; location: string; durationMinutes: number; isOnline: boolean; categories: string[] }[] = [
  { subject: 'Morning Clinical Standup', location: 'Nursing Station', durationMinutes: 15, isOnline: false, categories: ['Clinical'] },
  { subject: 'Weekly Regional Ops Review — Southwest', location: 'Teams Meeting', durationMinutes: 60, isOnline: true, categories: ['Regional Review'] },
  { subject: 'Care Conference — Room {room}', location: 'Conference Room A', durationMinutes: 30, isOnline: false, categories: ['Care Conference'] },
  { subject: 'CMS Survey Prep Meeting', location: 'Main Conference Room', durationMinutes: 60, isOnline: false, categories: ['Compliance', 'Survey'] },
  { subject: 'Physician Rounds — Dr. {physician}', location: '{facility}', durationMinutes: 120, isOnline: false, categories: ['Medical Staff'] },
  { subject: 'Staff In-Service: Fall Prevention', location: 'Training Room', durationMinutes: 45, isOnline: false, categories: ['Training'] },
  { subject: 'Monthly Quality Committee', location: 'Teams Meeting', durationMinutes: 60, isOnline: true, categories: ['Quality'] },
  { subject: 'Budget Review — Q2 Planning', location: 'Executive Conference Room', durationMinutes: 90, isOnline: true, categories: ['Finance'] },
  { subject: 'Infection Control Committee', location: 'Conference Room B', durationMinutes: 45, isOnline: false, categories: ['Infection Control'] },
  { subject: 'New Employee Orientation', location: 'Training Room', durationMinutes: 240, isOnline: false, categories: ['HR', 'Training'] },
];

// ---------------------------------------------------------------------------
// SharePoint Document Pool
// ---------------------------------------------------------------------------

const SHAREPOINT_DOCS: readonly { name: string; mimeType: string; size: number; folder: string; siteId: string }[] = [
  { name: 'Facility_Policies_2026.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1572864, folder: 'Policies', siteId: 'SITE-POLICIES' },
  { name: 'Emergency_Preparedness_Plan.pdf', mimeType: 'application/pdf', size: 3145728, folder: 'Emergency Plans', siteId: 'SITE-POLICIES' },
  { name: 'Infection_Control_Manual_2026.pdf', mimeType: 'application/pdf', size: 2621440, folder: 'Clinical Manuals', siteId: 'SITE-CLINICAL' },
  { name: 'CMS_Survey_Readiness_Checklist.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 524288, folder: 'Survey Readiness', siteId: 'SITE-COMPLIANCE' },
  { name: 'Fall_Prevention_Protocol.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 786432, folder: 'Clinical Manuals', siteId: 'SITE-CLINICAL' },
  { name: 'Employee_Handbook_2026.pdf', mimeType: 'application/pdf', size: 4194304, folder: 'HR Documents', siteId: 'SITE-HR' },
  { name: 'Dietary_Menu_Rotation_Spring2026.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 262144, folder: 'Dietary', siteId: 'SITE-OPS' },
  { name: 'HIPAA_Training_Materials.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 8388608, folder: 'Training', siteId: 'SITE-COMPLIANCE' },
  { name: 'Wound_Care_Protocol.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1048576, folder: 'Clinical Manuals', siteId: 'SITE-CLINICAL' },
  { name: 'Budget_Template_FY2026.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 393216, folder: 'Finance', siteId: 'SITE-FINANCE' },
  { name: 'Mock_Survey_Results_Mar2026.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 102400, folder: 'Survey Readiness', siteId: 'SITE-COMPLIANCE' },
  { name: 'Admission_Criteria_Guide.pdf', mimeType: 'application/pdf', size: 655360, folder: 'Admissions', siteId: 'SITE-OPS' },
];

// ---------------------------------------------------------------------------
// M365 Synthetic Client
// ---------------------------------------------------------------------------

export class M365SyntheticClient {

  getCalendar(
    filters: { startDate: string; endDate: string; userId?: string; calendarId?: string; limit?: number },
  ): { success: boolean; data: M365CalendarEvent[]; totalCount: number; source: string; retrievedAt: string } {
    const seed = `cal-${filters.startDate}-${filters.endDate}`;
    const limit = filters.limit ?? 50;
    const events: M365CalendarEvent[] = [];

    // Generate events for each business day in range
    const numEvents = Math.min(seededInt(5, 15, seed), limit);
    for (let i = 0; i < numEvents; i++) {
      const eSeed = `${seed}-${i}`;
      const template = CALENDAR_TEMPLATES[i % CALENDAR_TEMPLATES.length];
      const dayOffset = seededInt(0, 14, `${eSeed}-day`);
      const hour = seededInt(8, 16, `${eSeed}-hr`); // business hours 8am-4pm
      const facility = pick(DEMO_FACILITIES, `${eSeed}-fac`);

      let subject = template.subject
        .replace('{room}', `${seededInt(100, 300, `${eSeed}-room`)}`)
        .replace('{physician}', pick(['Sharma', 'Chen', 'Williams', 'Patel', 'Nguyen'] as const, `${eSeed}-doc`))
        .replace('{facility}', facility.name);

      events.push({
        id: `CAL-${seedHash(eSeed).toString(36).toUpperCase().slice(0, 10)}`,
        subject,
        body: { contentType: 'text', content: `${subject} — ${facility.name}` },
        start: { dateTime: `${daysAgo(-dayOffset)}T${String(hour).padStart(2, '0')}:00:00`, timeZone: 'America/Los_Angeles' },
        end: { dateTime: `${daysAgo(-dayOffset)}T${String(hour + Math.ceil(template.durationMinutes / 60)).padStart(2, '0')}:${String(template.durationMinutes % 60).padStart(2, '0')}:00`, timeZone: 'America/Los_Angeles' },
        location: template.location === '{facility}' ? { displayName: facility.name } : { displayName: template.location },
        organizer: { emailAddress: { name: pick(['Jennifer Walsh', 'David Hernandez', 'Lisa Park'] as const, `${eSeed}-org`), address: pick(['jennifer.walsh', 'david.hernandez', 'lisa.park'] as const, `${eSeed}-orge`) + '@ensigngroup.net' } },
        attendees: [
          { emailAddress: { name: 'Jennifer Walsh', address: 'jennifer.walsh@ensigngroup.net' }, type: 'required', status: { response: 'accepted', time: daysAgo(seededInt(1, 7, `${eSeed}-att1`)) + 'T10:00:00Z' } },
          { emailAddress: { name: 'Lisa Park', address: 'lisa.park@ensigngroup.net' }, type: 'required', status: { response: pick(['accepted', 'tentativelyAccepted'] as const, `${eSeed}-att2`), time: daysAgo(seededInt(1, 7, `${eSeed}-att2t`)) + 'T10:00:00Z' } },
        ],
        isAllDay: false,
        isCancelled: false,
        isOnlineMeeting: template.isOnline,
        onlineMeetingUrl: template.isOnline ? 'https://teams.microsoft.com/l/meetup-join/placeholder' : null,
        recurrence: i < 3 ? { pattern: { type: 'weekly', daysOfWeek: ['monday'], interval: 1 } } : null,
        responseStatus: { response: 'organizer', time: daysAgo(seededInt(7, 14, `${eSeed}-resp`)) + 'T09:00:00Z' },
        categories: template.categories,
      });
    }

    return {
      success: true,
      data: events,
      totalCount: events.length,
      source: 'microsoft_graph',
      retrievedAt: new Date().toISOString(),
    };
  }

  searchEmail(
    filters: { query?: string; from?: string; subject?: string; startDate?: string; endDate?: string; hasAttachments?: boolean; importance?: string; folder?: string; limit?: number; offset?: number },
  ): { success: boolean; data: M365Email[]; totalCount: number; source: string; retrievedAt: string } {
    const seed = `email-${JSON.stringify(filters).slice(0, 50)}`;
    const facility = pick(DEMO_FACILITIES, seed);

    let templates = [...EMAIL_TEMPLATES];

    if (filters.importance) {
      templates = templates.filter((t) => t.importance === filters.importance);
    }
    if (filters.subject) {
      const q = filters.subject.toLowerCase();
      templates = templates.filter((t) => t.subject.toLowerCase().includes(q));
    }
    if (filters.from) {
      const q = filters.from.toLowerCase();
      templates = templates.filter((t) => t.from.toLowerCase().includes(q));
    }

    const limit = filters.limit ?? 25;
    const emails: M365Email[] = templates.slice(0, limit).map((tmpl, i) => {
      const eSeed = `${seed}-${i}`;
      const dayOffset = seededInt(0, 30, `${eSeed}-day`);
      return {
        id: `MSG-${seedHash(eSeed).toString(36).toUpperCase().slice(0, 10)}`,
        conversationId: `CONV-${seedHash(`${eSeed}-conv`).toString(36).toUpperCase().slice(0, 10)}`,
        subject: tmpl.subject.replace('{facility}', facility.name),
        bodyPreview: tmpl.preview,
        body: { contentType: 'html', content: `<p>${tmpl.preview}</p>` },
        from: { emailAddress: { name: tmpl.fromName, address: tmpl.from } },
        toRecipients: [{ emailAddress: { name: 'Jennifer Walsh', address: 'jennifer.walsh@ensigngroup.net' } }],
        ccRecipients: seedHash(`${eSeed}-cc`) % 3 === 0 ? [{ emailAddress: { name: 'Lisa Park', address: 'lisa.park@ensigngroup.net' } }] : [],
        receivedDateTime: `${daysAgo(dayOffset)}T${String(seededInt(7, 18, `${eSeed}-hr`)).padStart(2, '0')}:${String(seededInt(0, 59, `${eSeed}-min`)).padStart(2, '0')}:00Z`,
        sentDateTime: `${daysAgo(dayOffset)}T${String(seededInt(7, 18, `${eSeed}-shr`)).padStart(2, '0')}:${String(seededInt(0, 59, `${eSeed}-smin`)).padStart(2, '0')}:00Z`,
        isRead: seedHash(`${eSeed}-read`) % 4 !== 0,
        importance: tmpl.importance,
        hasAttachments: seedHash(`${eSeed}-att`) % 3 === 0,
        attachments: seedHash(`${eSeed}-att`) % 3 === 0 ? [{
          id: `ATT-${seedHash(`${eSeed}-attid`).toString(36).toUpperCase().slice(0, 6)}`,
          name: pick(['Report.xlsx', 'Summary.pdf', 'Analysis.docx', 'Data.csv'] as const, `${eSeed}-attname`),
          contentType: 'application/octet-stream',
          size: seededInt(50000, 500000, `${eSeed}-attsize`),
          isInline: false,
          lastModifiedDateTime: `${daysAgo(dayOffset)}T12:00:00Z`,
        }] : [],
        categories: tmpl.categories,
        flag: { flagStatus: seedHash(`${eSeed}-flag`) % 5 === 0 ? 'flagged' : 'notFlagged' },
      };
    });

    return {
      success: true,
      data: emails,
      totalCount: emails.length,
      source: 'microsoft_graph',
      retrievedAt: new Date().toISOString(),
    };
  }

  getEmail(emailId: string): { success: boolean; data: M365Email; source: string; retrievedAt: string } {
    const result = this.searchEmail({ limit: 10 });
    const email = result.data.find((e) => e.id === emailId) ?? result.data[0];
    return {
      success: true,
      data: { ...email, id: emailId },
      source: 'microsoft_graph',
      retrievedAt: new Date().toISOString(),
    };
  }

  getSharePointFiles(
    filters: { siteId: string; driveId?: string; folderId?: string; limit?: number; offset?: number },
  ): { success: boolean; data: M365SharePointFile[]; totalCount: number; source: string; retrievedAt: string } {
    let docs = [...SHAREPOINT_DOCS];
    if (filters.siteId) {
      docs = docs.filter((d) => d.siteId === filters.siteId || true); // show all for demo
    }

    const limit = filters.limit ?? 50;
    const files: M365SharePointFile[] = docs.slice(0, limit).map((doc, i) => {
      const fSeed = `sp-${doc.name}-${i}`;
      return {
        id: `SP-${seedHash(fSeed).toString(36).toUpperCase().slice(0, 8)}`,
        name: doc.name,
        webUrl: `https://ensigngroup.sharepoint.com/sites/${doc.siteId.replace('SITE-', '')}/Shared Documents/${doc.folder}/${doc.name}`,
        createdDateTime: daysAgo(seededInt(90, 365, `${fSeed}-created`)) + 'T10:00:00Z',
        lastModifiedDateTime: daysAgo(seededInt(1, 60, `${fSeed}-modified`)) + 'T14:30:00Z',
        size: doc.size,
        createdBy: { user: { displayName: pick(['Compliance Team', 'Operations', 'HR Department', 'Quality Department'] as const, `${fSeed}-crby`), email: pick(['compliance', 'operations', 'hr', 'quality'] as const, `${fSeed}-cremail`) + '@ensigngroup.net' } },
        lastModifiedBy: { user: { displayName: pick(['Sarah Mitchell', 'Mark Johnson', 'Lisa Park', 'Jennifer Walsh'] as const, `${fSeed}-modby`), email: pick(['sarah.mitchell', 'mark.johnson', 'lisa.park', 'jennifer.walsh'] as const, `${fSeed}-modemail`) + '@ensigngroup.net' } },
        file: { mimeType: doc.mimeType },
        parentReference: { driveId: 'DRV-001', id: 'ROOT', path: `/drive/root:/Shared Documents/${doc.folder}` },
      };
    });

    return {
      success: true,
      data: files,
      totalCount: files.length,
      source: 'microsoft_graph',
      retrievedAt: new Date().toISOString(),
    };
  }

  searchSharePoint(
    filters: { query: string; siteId?: string; fileType?: string; limit?: number },
  ): { success: boolean; data: object[]; totalCount: number; source: string; retrievedAt: string } {
    const q = filters.query.toLowerCase();
    const matches = SHAREPOINT_DOCS.filter((d) =>
      d.name.toLowerCase().includes(q) || d.folder.toLowerCase().includes(q),
    );

    const results = matches.slice(0, filters.limit ?? 25).map((doc, i) => ({
      id: `SP-${seedHash(`search-${doc.name}`).toString(36).toUpperCase().slice(0, 8)}`,
      name: doc.name,
      webUrl: `https://ensigngroup.sharepoint.com/sites/${doc.siteId.replace('SITE-', '')}/Shared Documents/${doc.folder}/${doc.name}`,
      siteName: doc.siteId.replace('SITE-', ''),
      lastModifiedDateTime: daysAgo(seededInt(1, 60, `search-${doc.name}`)) + 'T14:30:00Z',
      size: doc.size,
      hitHighlightedSummary: `...document contains <strong>${filters.query}</strong> related content...`,
    }));

    return {
      success: true,
      data: results,
      totalCount: results.length,
      source: 'microsoft_graph_search',
      retrievedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const m365SyntheticClient = new M365SyntheticClient();
