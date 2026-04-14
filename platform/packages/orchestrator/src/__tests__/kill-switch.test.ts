import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KillSwitch } from '../kill-switch.js';

describe('KillSwitch', () => {
  let ks: KillSwitch;

  beforeEach(() => {
    ks = new KillSwitch();
  });

  describe('enable/disable', () => {
    it('starts enabled by default', () => {
      expect(ks.isEnabled()).toBe(true);
    });

    it('disable() blocks new sessions', () => {
      ks.disable('cost exceeded');
      expect(ks.isEnabled()).toBe(false);
    });

    it('disable() records reason and metadata', () => {
      ks.disable('aurora ACU spike', 'alarm');
      const state = ks.getState();
      expect(state.enabled).toBe(false);
      expect(state.reason).toBe('aurora ACU spike');
      expect(state.disabledBy).toBe('alarm');
      expect(state.disabledAt).toBeTruthy();
    });

    it('enable() re-enables after disable', () => {
      ks.disable('test');
      ks.enable();
      expect(ks.isEnabled()).toBe(true);
    });

    it('enable() clears reason and metadata', () => {
      ks.disable('test', 'admin');
      ks.enable();
      const state = ks.getState();
      expect(state.reason).toBeNull();
      expect(state.disabledAt).toBeNull();
      expect(state.disabledBy).toBeNull();
    });
  });

  describe('getState', () => {
    it('returns enabled state', () => {
      const state = ks.getState();
      expect(state).toEqual({
        enabled: true,
        reason: null,
        disabledAt: null,
        disabledBy: null,
      });
    });

    it('returns disabled state with full metadata', () => {
      ks.disable('spending limit', 'api');
      const state = ks.getState();
      expect(state.enabled).toBe(false);
      expect(state.reason).toBe('spending limit');
      expect(state.disabledBy).toBe('api');
      expect(typeof state.disabledAt).toBe('string');
    });
  });

  describe('fromEnvironment', () => {
    it('returns enabled when no env vars set', async () => {
      delete process.env.KILL_SWITCH_ENABLED;
      delete process.env.KILL_SWITCH_SSM_PARAM;
      const instance = await KillSwitch.fromEnvironment();
      expect(instance.isEnabled()).toBe(true);
    });

    it('returns disabled when KILL_SWITCH_ENABLED=false', async () => {
      process.env.KILL_SWITCH_ENABLED = 'false';
      process.env.KILL_SWITCH_REASON = 'budget exceeded';
      delete process.env.KILL_SWITCH_SSM_PARAM;

      const instance = await KillSwitch.fromEnvironment();
      expect(instance.isEnabled()).toBe(false);
      expect(instance.getState().reason).toBe('budget exceeded');

      delete process.env.KILL_SWITCH_ENABLED;
      delete process.env.KILL_SWITCH_REASON;
    });
  });

  describe('logging', () => {
    it('logs warning on disable when logger provided', () => {
      const warn = vi.fn();
      const logger = { warn, info: vi.fn(), debug: vi.fn() } as never;
      const logged = new KillSwitch(logger);

      logged.disable('test reason', 'admin');
      expect(warn).toHaveBeenCalledWith(
        { reason: 'test reason', by: 'admin' },
        'kill-switch.disabled — all new sessions blocked',
      );
    });

    it('logs info on re-enable when logger provided', () => {
      const info = vi.fn();
      const logger = { warn: vi.fn(), info, debug: vi.fn() } as never;
      const logged = new KillSwitch(logger);

      logged.disable('test');
      logged.enable();
      expect(info).toHaveBeenCalledWith('kill-switch.enabled — sessions unblocked');
    });
  });
});
