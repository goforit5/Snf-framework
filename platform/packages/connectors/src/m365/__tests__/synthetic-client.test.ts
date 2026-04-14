/**
 * Tests for M365 Synthetic Client.
 * Validates calendar events are in business hours and email structure.
 */

import { describe, it, expect } from 'vitest';
import { M365SyntheticClient } from '../synthetic-client.js';

const client = new M365SyntheticClient();

describe('M365SyntheticClient', () => {
  describe('getCalendar', () => {
    it('returns events within business hours (8am-5pm)', () => {
      const result = client.getCalendar({
        startDate: '2026-04-07',
        endDate: '2026-04-21',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(5);

      for (const event of result.data) {
        const hour = parseInt(event.start.dateTime.split('T')[1].split(':')[0], 10);
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThanOrEqual(16);
        expect(event.subject).toBeTruthy();
        expect(event.isAllDay).toBe(false);
      }
    });

    it('events have valid attendees', () => {
      const result = client.getCalendar({ startDate: '2026-04-07', endDate: '2026-04-14' });
      for (const event of result.data) {
        expect(event.attendees.length).toBeGreaterThanOrEqual(1);
        for (const att of event.attendees) {
          expect(att.emailAddress.address).toContain('@ensigngroup.net');
          expect(att.type).toMatch(/^(required|optional|resource)$/);
        }
      }
    });

    it('online meetings have Teams URL', () => {
      const result = client.getCalendar({ startDate: '2026-04-07', endDate: '2026-04-21' });
      for (const event of result.data) {
        if (event.isOnlineMeeting) {
          expect(event.onlineMeetingUrl).toBeTruthy();
        }
      }
    });
  });

  describe('searchEmail', () => {
    it('returns emails with valid structure', () => {
      const result = client.searchEmail({});

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);

      for (const email of result.data) {
        expect(email.id).toBeTruthy();
        expect(email.subject).toBeTruthy();
        expect(email.from.emailAddress.address).toContain('@');
        expect(email.toRecipients.length).toBeGreaterThanOrEqual(1);
        expect(email.receivedDateTime).toBeTruthy();
        expect(email.importance).toMatch(/^(low|normal|high)$/);
        expect(typeof email.isRead).toBe('boolean');
      }
    });

    it('filters by importance', () => {
      const result = client.searchEmail({ importance: 'high' });
      for (const email of result.data) {
        expect(email.importance).toBe('high');
      }
    });

    it('SNF operations themed subjects', () => {
      const result = client.searchEmail({});
      const subjects = result.data.map((e) => e.subject.toLowerCase());
      const relevantTerms = ['staffing', 'survey', 'quality', 'budget', 'credential', 'admission', 'incident', 'compliance', 'regional', 'ops'];
      const hasRelevant = subjects.some((s) => relevantTerms.some((t) => s.includes(t)));
      expect(hasRelevant).toBe(true);
    });
  });

  describe('getSharePointFiles', () => {
    it('returns policy and procedure documents', () => {
      const result = client.getSharePointFiles({ siteId: 'SITE-POLICIES' });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);

      for (const file of result.data) {
        expect(file.name).toBeTruthy();
        expect(file.webUrl).toContain('sharepoint.com');
        expect(file.size).toBeGreaterThan(0);
        expect(file.createdBy.user.displayName).toBeTruthy();
        expect(file.lastModifiedBy.user.displayName).toBeTruthy();
      }
    });

    it('includes survey prep docs', () => {
      const result = client.getSharePointFiles({ siteId: 'SITE-COMPLIANCE' });
      const names = result.data.map((f) => f.name.toLowerCase());
      const hasSurvey = names.some((n) => n.includes('survey') || n.includes('compliance') || n.includes('hipaa'));
      expect(hasSurvey).toBe(true);
    });
  });

  describe('searchSharePoint', () => {
    it('searches across document names', () => {
      const result = client.searchSharePoint({ query: 'infection' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deterministic', () => {
    it('same input produces same output', () => {
      const r1 = client.getCalendar({ startDate: '2026-04-07', endDate: '2026-04-14' });
      const r2 = client.getCalendar({ startDate: '2026-04-07', endDate: '2026-04-14' });
      expect(r1.data.length).toBe(r2.data.length);
      expect(r1.data[0].subject).toBe(r2.data[0].subject);
    });
  });
});
