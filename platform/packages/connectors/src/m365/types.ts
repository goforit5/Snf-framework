/**
 * Microsoft 365 / Graph API types.
 * Maps Graph API responses to platform-usable structures.
 */

// --- Email (Outlook) ---

export interface M365Email {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: { contentType: 'text' | 'html'; content: string };
  from: M365Recipient;
  toRecipients: M365Recipient[];
  ccRecipients: M365Recipient[];
  receivedDateTime: string;
  sentDateTime: string;
  isRead: boolean;
  importance: 'low' | 'normal' | 'high';
  hasAttachments: boolean;
  attachments: M365Attachment[];
  categories: string[];
  flag: { flagStatus: 'notFlagged' | 'flagged' | 'complete' };
}

export interface M365Recipient {
  emailAddress: { name: string; address: string };
}

export interface M365Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  lastModifiedDateTime: string;
}

export interface M365EmailSearch {
  query?: string;
  from?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
  hasAttachments?: boolean;
  importance?: M365Email['importance'];
  folder?: string;
  limit?: number;
  offset?: number;
}

// --- Calendar ---

export interface M365CalendarEvent {
  id: string;
  subject: string;
  body: { contentType: 'text' | 'html'; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location: { displayName: string; address?: object } | null;
  organizer: M365Recipient;
  attendees: M365Attendee[];
  isAllDay: boolean;
  isCancelled: boolean;
  isOnlineMeeting: boolean;
  onlineMeetingUrl: string | null;
  recurrence: object | null;
  responseStatus: { response: 'none' | 'organizer' | 'accepted' | 'declined' | 'tentativelyAccepted'; time: string };
  categories: string[];
}

export interface M365Attendee {
  emailAddress: { name: string; address: string };
  type: 'required' | 'optional' | 'resource';
  status: { response: 'none' | 'accepted' | 'declined' | 'tentativelyAccepted'; time: string };
}

export interface M365CreateEvent {
  subject: string;
  body?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  location?: string;
  attendees?: string[];
  isOnlineMeeting?: boolean;
}

// --- SharePoint ---

export interface M365SharePointFile {
  id: string;
  name: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  size: number;
  createdBy: { user: { displayName: string; email: string } };
  lastModifiedBy: { user: { displayName: string; email: string } };
  folder?: { childCount: number };
  file?: { mimeType: string; hashes?: { sha256Hash: string } };
  parentReference: { driveId: string; id: string; path: string };
}

export interface M365SharePointSearch {
  query: string;
  siteId?: string;
  driveId?: string;
  fileType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// --- Teams ---

export interface M365TeamsMessage {
  id: string;
  messageType: 'message' | 'systemEventMessage';
  createdDateTime: string;
  lastModifiedDateTime: string;
  from: { user: { displayName: string; id: string } } | null;
  body: { contentType: 'text' | 'html'; content: string };
  attachments: M365Attachment[];
  mentions: { id: number; mentionText: string; mentioned: { user: { displayName: string; id: string } } }[];
  reactions: { reactionType: string; user: { displayName: string } }[];
  channelIdentity: { teamId: string; channelId: string };
}

export interface M365TeamsMessageSearch {
  teamId: string;
  channelId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// --- Send Email ---

export interface M365SendEmail {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  bodyType?: 'text' | 'html';
  importance?: 'low' | 'normal' | 'high';
  saveToSentItems?: boolean;
}
