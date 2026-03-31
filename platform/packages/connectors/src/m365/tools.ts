/**
 * Microsoft 365 MCP tool definitions.
 * Each tool: name, description, inputSchema (JSON Schema), handler returning mock data.
 * Uses Microsoft Graph API patterns.
 */

import type {
  M365Email,
  M365CalendarEvent,
  M365SharePointFile,
  M365TeamsMessage,
} from './types.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

// --- Mock Data Generators ---

function mockEmail(overrides?: Partial<M365Email>): M365Email {
  return {
    id: 'AAMkAGI2THVSAAA=',
    conversationId: 'AAQkAGI2THVSAAA=',
    subject: 'Q1 2026 Staffing Analysis - Desert Springs',
    bodyPreview: 'Jennifer, attached is the Q1 staffing analysis for Desert Springs. Key findings: RN vacancy rate improved from 8.2% to 4.1%...',
    body: {
      contentType: 'html',
      content: '<html><body><p>Jennifer,</p><p>Attached is the Q1 staffing analysis for Desert Springs. Key findings:</p><ul><li>RN vacancy rate improved from 8.2% to 4.1%</li><li>CNA overtime decreased 23% vs Q4 2025</li><li>Agency spend down $47K/month</li></ul><p>Recommend we replicate the retention incentive program at Sunflower and Mesa Verde.</p></body></html>',
    },
    from: { emailAddress: { name: 'David Hernandez', address: 'david.hernandez@ensigngroup.net' } },
    toRecipients: [{ emailAddress: { name: 'Jennifer Walsh', address: 'jennifer.walsh@ensigngroup.net' } }],
    ccRecipients: [{ emailAddress: { name: 'Lisa Park', address: 'lisa.park@ensigngroup.net' } }],
    receivedDateTime: '2026-03-28T14:32:00Z',
    sentDateTime: '2026-03-28T14:31:45Z',
    isRead: true,
    importance: 'normal',
    hasAttachments: true,
    attachments: [
      { id: 'ATT-001', name: 'Q1_2026_Staffing_Analysis_DesertSprings.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 245760, isInline: false, lastModifiedDateTime: '2026-03-28T14:15:00Z' },
    ],
    categories: ['Staffing', 'Southwest Region'],
    flag: { flagStatus: 'notFlagged' },
    ...overrides,
  };
}

function mockCalendarEvent(overrides?: Partial<M365CalendarEvent>): M365CalendarEvent {
  return {
    id: 'AAMkAGI2CAL001=',
    subject: 'Weekly Regional Ops Review - Southwest',
    body: { contentType: 'text', content: 'Weekly review of Southwest region facility operations, staffing, and census.' },
    start: { dateTime: '2026-03-31T15:00:00', timeZone: 'America/Phoenix' },
    end: { dateTime: '2026-03-31T16:00:00', timeZone: 'America/Phoenix' },
    location: { displayName: 'Teams Meeting' },
    organizer: { emailAddress: { name: 'David Hernandez', address: 'david.hernandez@ensigngroup.net' } },
    attendees: [
      { emailAddress: { name: 'Jennifer Walsh', address: 'jennifer.walsh@ensigngroup.net' }, type: 'required', status: { response: 'accepted', time: '2026-03-25T10:00:00Z' } },
      { emailAddress: { name: 'Lisa Park', address: 'lisa.park@ensigngroup.net' }, type: 'required', status: { response: 'accepted', time: '2026-03-25T11:30:00Z' } },
      { emailAddress: { name: 'Robert Kim', address: 'robert.kim@ensigngroup.net' }, type: 'optional', status: { response: 'tentativelyAccepted', time: '2026-03-26T08:00:00Z' } },
    ],
    isAllDay: false,
    isCancelled: false,
    isOnlineMeeting: true,
    onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup-join/placeholder',
    recurrence: { pattern: { type: 'weekly', daysOfWeek: ['monday'], interval: 1 } },
    responseStatus: { response: 'organizer', time: '2026-03-20T09:00:00Z' },
    categories: ['Regional Review'],
    ...overrides,
  };
}

// --- Tool Definitions ---

export const m365Tools: MCPToolDefinition[] = [
  {
    name: 'm365_search_email',
    description:
      'Search Outlook emails by sender, subject, date range, or free text. Returns email headers and preview. Uses Microsoft Graph /messages endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search across subject, body, sender' },
        from: { type: 'string', description: 'Filter by sender email address' },
        subject: { type: 'string', description: 'Filter by subject line (partial match)' },
        startDate: { type: 'string', description: 'Received after this date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Received before this date (YYYY-MM-DD)' },
        hasAttachments: { type: 'boolean', description: 'Filter to emails with attachments' },
        importance: { type: 'string', enum: ['low', 'normal', 'high'], description: 'Filter by importance' },
        folder: { type: 'string', description: 'Mail folder (inbox, sentItems, drafts)', default: 'inbox' },
        limit: { type: 'number', description: 'Max results (default 25)', default: 25 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 },
      },
    },
    handler: async (input) => {
      return {
        success: true,
        data: [
          mockEmail(),
          mockEmail({
            id: 'AAMkAGI2THVSAAB=',
            subject: 'URGENT: CMS Survey Scheduled - Mesa Verde',
            bodyPreview: 'Heads up - CMS survey team arriving at Mesa Verde tomorrow morning. All departments on alert...',
            from: { emailAddress: { name: 'Compliance Team', address: 'compliance@ensigngroup.net' } },
            receivedDateTime: '2026-03-29T08:15:00Z',
            importance: 'high',
            hasAttachments: false,
            attachments: [],
            categories: ['Compliance', 'Survey'],
          }),
        ],
        totalCount: 2,
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_get_email',
    description:
      'Get a specific email by ID with full body and attachment metadata. Use m365_search_email first to find the ID.',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'string', description: 'Email message ID from Graph API' },
        includeAttachments: { type: 'boolean', description: 'Include attachment content (base64)', default: false },
      },
      required: ['emailId'],
    },
    handler: async (input) => {
      return {
        success: true,
        data: mockEmail({ id: input.emailId as string }),
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_send_email',
    description:
      'Send an email via Outlook. GOVERNANCE: Level 4+ (requires human approval). Agent drafts the email; human reviews and approves before send.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: 'Recipient email addresses' },
        cc: { type: 'array', items: { type: 'string' }, description: 'CC email addresses' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (plain text or HTML)' },
        bodyType: { type: 'string', enum: ['text', 'html'], description: 'Body content type', default: 'html' },
        importance: { type: 'string', enum: ['low', 'normal', 'high'], description: 'Email importance', default: 'normal' },
        saveToSentItems: { type: 'boolean', description: 'Save to Sent Items folder', default: true },
      },
      required: ['to', 'subject', 'body'],
    },
    handler: async (input) => {
      return {
        success: true,
        data: {
          messageId: 'AAMkAGI2SENT001=',
          status: 'queued_for_approval',
          governanceLevel: 4,
          message: 'Email queued for human approval before sending (Governance Level 4)',
        },
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_get_calendar',
    description:
      'Get calendar events for a user or shared calendar. Returns event details, attendees, and response status.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User email or ID (defaults to service account)' },
        startDate: { type: 'string', description: 'Events starting after this date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Events starting before this date (YYYY-MM-DD)' },
        calendarId: { type: 'string', description: 'Specific calendar ID (for shared/room calendars)' },
        limit: { type: 'number', description: 'Max results', default: 50 },
      },
      required: ['startDate', 'endDate'],
    },
    handler: async (input) => {
      return {
        success: true,
        data: [
          mockCalendarEvent(),
          mockCalendarEvent({
            id: 'AAMkAGI2CAL002=',
            subject: 'Quarterly Board Presentation Prep',
            start: { dateTime: '2026-03-31T10:00:00', timeZone: 'America/Los_Angeles' },
            end: { dateTime: '2026-03-31T11:30:00', timeZone: 'America/Los_Angeles' },
            isOnlineMeeting: false,
            location: { displayName: 'Executive Conference Room - Mission Viejo HQ' },
            recurrence: null,
          }),
        ],
        totalCount: 2,
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_create_event',
    description:
      'Create a calendar event. Can optionally send invitations to attendees and create a Teams meeting link.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Event subject' },
        body: { type: 'string', description: 'Event body/description' },
        startDateTime: { type: 'string', description: 'Start date/time (ISO 8601)' },
        endDateTime: { type: 'string', description: 'End date/time (ISO 8601)' },
        timeZone: { type: 'string', description: 'Time zone (e.g., America/Phoenix)', default: 'America/Los_Angeles' },
        location: { type: 'string', description: 'Location name' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee email addresses' },
        isOnlineMeeting: { type: 'boolean', description: 'Create Teams meeting link', default: false },
      },
      required: ['subject', 'startDateTime', 'endDateTime'],
    },
    handler: async (input) => {
      return {
        success: true,
        data: {
          eventId: 'AAMkAGI2CAL-NEW-001=',
          subject: input.subject,
          status: 'created',
          onlineMeetingUrl: input.isOnlineMeeting ? 'https://teams.microsoft.com/l/meetup-join/placeholder-new' : null,
        },
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_get_sharepoint_files',
    description:
      'List files in a SharePoint document library or folder. Returns file metadata, size, and last modified info.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'SharePoint site ID' },
        driveId: { type: 'string', description: 'Document library drive ID' },
        folderId: { type: 'string', description: 'Folder ID within the drive (root if omitted)' },
        limit: { type: 'number', description: 'Max results', default: 50 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 },
      },
      required: ['siteId'],
    },
    handler: async (input) => {
      const files: M365SharePointFile[] = [
        {
          id: 'SP-FILE-001',
          name: 'Facility_Policies_2026.docx',
          webUrl: 'https://ensigngroup.sharepoint.com/sites/Policies/Shared Documents/Facility_Policies_2026.docx',
          createdDateTime: '2025-12-15T10:00:00Z',
          lastModifiedDateTime: '2026-03-20T14:30:00Z',
          size: 1572864,
          createdBy: { user: { displayName: 'Compliance Team', email: 'compliance@ensigngroup.net' } },
          lastModifiedBy: { user: { displayName: 'Sarah Mitchell', email: 'sarah.mitchell@ensigngroup.net' } },
          file: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          parentReference: { driveId: 'DRV-001', id: 'ROOT', path: '/drive/root:/Shared Documents' },
        },
        {
          id: 'SP-FILE-002',
          name: 'Emergency_Preparedness_Plan.pdf',
          webUrl: 'https://ensigngroup.sharepoint.com/sites/Policies/Shared Documents/Emergency_Preparedness_Plan.pdf',
          createdDateTime: '2025-09-01T08:00:00Z',
          lastModifiedDateTime: '2026-02-10T11:15:00Z',
          size: 3145728,
          createdBy: { user: { displayName: 'Operations', email: 'operations@ensigngroup.net' } },
          lastModifiedBy: { user: { displayName: 'Mark Johnson', email: 'mark.johnson@ensigngroup.net' } },
          file: { mimeType: 'application/pdf' },
          parentReference: { driveId: 'DRV-001', id: 'ROOT', path: '/drive/root:/Shared Documents' },
        },
        {
          id: 'SP-FOLDER-001',
          name: 'Survey Readiness',
          webUrl: 'https://ensigngroup.sharepoint.com/sites/Policies/Shared Documents/Survey Readiness',
          createdDateTime: '2025-06-01T09:00:00Z',
          lastModifiedDateTime: '2026-03-25T16:00:00Z',
          size: 0,
          createdBy: { user: { displayName: 'Compliance Team', email: 'compliance@ensigngroup.net' } },
          lastModifiedBy: { user: { displayName: 'Compliance Team', email: 'compliance@ensigngroup.net' } },
          folder: { childCount: 24 },
          parentReference: { driveId: 'DRV-001', id: 'ROOT', path: '/drive/root:/Shared Documents' },
        },
      ];
      return {
        success: true,
        data: files,
        totalCount: 3,
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_get_sharepoint_file',
    description:
      'Download or read a specific SharePoint file by ID. Returns file metadata and content (text-based files) or download URL (binary files).',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'SharePoint site ID' },
        fileId: { type: 'string', description: 'File item ID' },
        driveId: { type: 'string', description: 'Document library drive ID' },
      },
      required: ['siteId', 'fileId'],
    },
    handler: async (input) => {
      return {
        success: true,
        data: {
          id: input.fileId,
          name: 'Facility_Policies_2026.docx',
          size: 1572864,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          downloadUrl: 'https://ensigngroup.sharepoint.com/_api/v2.0/drives/DRV-001/items/SP-FILE-001/content',
          contentPreview: 'Section 1: Infection Control Policy\n\n1.1 Purpose: To establish procedures for the prevention and control of infections...',
          lastModifiedDateTime: '2026-03-20T14:30:00Z',
          lastModifiedBy: 'Sarah Mitchell',
        },
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_search_sharepoint',
    description:
      'Search across all SharePoint sites and document libraries. Uses Microsoft Search API for full-text search across documents.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (supports KQL syntax)' },
        siteId: { type: 'string', description: 'Restrict to specific SharePoint site' },
        fileType: { type: 'string', description: 'Filter by file type (docx, pdf, xlsx, etc.)' },
        startDate: { type: 'string', description: 'Modified after this date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Modified before this date (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Max results', default: 25 },
      },
      required: ['query'],
    },
    handler: async (input) => {
      return {
        success: true,
        data: [
          {
            id: 'SP-FILE-001',
            name: 'Facility_Policies_2026.docx',
            webUrl: 'https://ensigngroup.sharepoint.com/sites/Policies/Shared Documents/Facility_Policies_2026.docx',
            siteName: 'Policies',
            lastModifiedDateTime: '2026-03-20T14:30:00Z',
            size: 1572864,
            hitHighlightedSummary: '...infection control <strong>policy</strong> requires daily screening of all residents and staff...',
          },
        ],
        totalCount: 1,
        source: 'microsoft_graph_search',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'm365_get_teams_messages',
    description:
      'Get messages from a Microsoft Teams channel. Returns messages with sender, content, attachments, and reactions.',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'string', description: 'Teams team ID' },
        channelId: { type: 'string', description: 'Teams channel ID' },
        startDate: { type: 'string', description: 'Messages after this date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Messages before this date (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Max results', default: 50 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 },
      },
      required: ['teamId', 'channelId'],
    },
    handler: async (input) => {
      const messages: M365TeamsMessage[] = [
        {
          id: 'MSG-TEAMS-001',
          messageType: 'message',
          createdDateTime: '2026-03-29T09:15:00Z',
          lastModifiedDateTime: '2026-03-29T09:15:00Z',
          from: { user: { displayName: 'Jennifer Walsh', id: 'USR-201' } },
          body: { contentType: 'html', content: '<p>Team - reminder that CMS survey prep meeting is tomorrow at 8am. Please bring your department checklists. @Lisa Park can you confirm the mock survey results are uploaded to SharePoint?</p>' },
          attachments: [],
          mentions: [{ id: 1, mentionText: 'Lisa Park', mentioned: { user: { displayName: 'Lisa Park', id: 'USR-205' } } }],
          reactions: [{ reactionType: 'like', user: { displayName: 'Lisa Park' } }],
          channelIdentity: { teamId: input.teamId as string, channelId: input.channelId as string },
        },
        {
          id: 'MSG-TEAMS-002',
          messageType: 'message',
          createdDateTime: '2026-03-29T09:22:00Z',
          lastModifiedDateTime: '2026-03-29T09:22:00Z',
          from: { user: { displayName: 'Lisa Park', id: 'USR-205' } },
          body: { contentType: 'text', content: 'Confirmed - mock survey results uploaded to Survey Readiness folder. We scored 94% on infection control, 87% on fall prevention. Detailed breakdown in the file.' },
          attachments: [{ id: 'ATT-T-001', name: 'Mock_Survey_Results_Mar2026.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 102400, isInline: false, lastModifiedDateTime: '2026-03-29T09:20:00Z' }],
          mentions: [],
          reactions: [{ reactionType: 'like', user: { displayName: 'Jennifer Walsh' } }, { reactionType: 'heart', user: { displayName: 'Robert Kim' } }],
          channelIdentity: { teamId: input.teamId as string, channelId: input.channelId as string },
        },
      ];
      return {
        success: true,
        data: messages,
        totalCount: 2,
        source: 'microsoft_graph',
        retrievedAt: new Date().toISOString(),
      };
    },
  },
];
