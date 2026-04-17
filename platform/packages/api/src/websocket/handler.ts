import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type {
  Decision,
  AgentStatus,
  AuditEntry,
  AgentDomain,
} from '@snf/core';
import { verifyToken } from '../middleware/auth.js';

// --- Event types pushed to clients ---

export type WsEventType =
  | 'new_decision'
  | 'decision_updated'
  | 'agent_status_change'
  | 'audit_entry'
  | 'heartbeat'
  | 'error';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  timestamp: string;
  payload: T;
}

export interface NewDecisionPayload {
  decision: Decision;
}

export interface DecisionUpdatedPayload {
  decisionId: string;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface AgentStatusChangePayload {
  agentId: string;
  previousStatus: AgentStatus;
  newStatus: AgentStatus;
  reason: string;
  changedBy: string;
}

export interface AuditEntryPayload {
  entry: AuditEntry;
}

// --- Client subscription ---

interface ClientSubscription {
  /** Subscribe to all events */
  global: boolean;
  /** Subscribe to specific facility events */
  facilityIds: Set<string>;
  /** Subscribe to specific domain events */
  domains: Set<AgentDomain>;
}

interface SubscribeMessage {
  action: 'subscribe';
  rooms: {
    global?: boolean;
    facilityIds?: string[];
    domains?: AgentDomain[];
  };
}

interface UnsubscribeMessage {
  action: 'unsubscribe';
  rooms: {
    global?: boolean;
    facilityIds?: string[];
    domains?: AgentDomain[];
  };
}

type ClientMessage = SubscribeMessage | UnsubscribeMessage | { action: 'ping' };

// --- Connection manager (singleton) ---

class ConnectionManager {
  private clients = new Map<WebSocket, ClientSubscription>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  start(): void {
    // Send heartbeat every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        payload: { connectedClients: this.clients.size },
      });
    }, 30_000);
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    for (const [ws] of this.clients) {
      ws.close(1001, 'Server shutting down');
    }
    this.clients.clear();
  }

  addClient(ws: WebSocket): void {
    this.clients.set(ws, {
      global: false,
      facilityIds: new Set(),
      domains: new Set(),
    });
  }

  removeClient(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  handleMessage(ws: WebSocket, raw: string): void {
    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      this.sendTo(ws, {
        type: 'error',
        timestamp: new Date().toISOString(),
        payload: { error: 'Invalid JSON' },
      });
      return;
    }

    if (message.action === 'ping') {
      this.sendTo(ws, {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        payload: { pong: true },
      });
      return;
    }

    const sub = this.clients.get(ws);
    if (!sub) return;

    if (message.action === 'subscribe') {
      if (message.rooms.global) sub.global = true;
      if (message.rooms.facilityIds) {
        for (const id of message.rooms.facilityIds) sub.facilityIds.add(id);
      }
      if (message.rooms.domains) {
        for (const d of message.rooms.domains) sub.domains.add(d);
      }
      this.sendTo(ws, {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        payload: {
          subscribed: {
            global: sub.global,
            facilityIds: [...sub.facilityIds],
            domains: [...sub.domains],
          },
        },
      });
      return;
    }

    if (message.action === 'unsubscribe') {
      if (message.rooms.global) sub.global = false;
      if (message.rooms.facilityIds) {
        for (const id of message.rooms.facilityIds) sub.facilityIds.delete(id);
      }
      if (message.rooms.domains) {
        for (const d of message.rooms.domains) sub.domains.delete(d);
      }
      return;
    }
  }

  /**
   * Push a new decision to subscribed clients.
   */
  pushNewDecision(decision: Decision): void {
    const event: WsEvent<NewDecisionPayload> = {
      type: 'new_decision',
      timestamp: new Date().toISOString(),
      payload: { decision },
    };

    for (const [ws, sub] of this.clients) {
      if (this.shouldReceive(sub, decision.facilityId, decision.domain as AgentDomain)) {
        this.sendTo(ws, event);
      }
    }
  }

  /**
   * Push a decision status update to subscribed clients.
   */
  pushDecisionUpdate(update: DecisionUpdatedPayload, facilityId: string, domain: string): void {
    const event: WsEvent<DecisionUpdatedPayload> = {
      type: 'decision_updated',
      timestamp: new Date().toISOString(),
      payload: update,
    };

    for (const [ws, sub] of this.clients) {
      if (this.shouldReceive(sub, facilityId, domain as AgentDomain)) {
        this.sendTo(ws, event);
      }
    }
  }

  /**
   * Push an agent status change to all global subscribers.
   */
  pushAgentStatusChange(change: AgentStatusChangePayload): void {
    const event: WsEvent<AgentStatusChangePayload> = {
      type: 'agent_status_change',
      timestamp: new Date().toISOString(),
      payload: change,
    };

    for (const [ws, sub] of this.clients) {
      if (sub.global) {
        this.sendTo(ws, event);
      }
    }
  }

  /**
   * Push an audit entry to subscribed clients.
   */
  pushAuditEntry(entry: AuditEntry): void {
    const event: WsEvent<AuditEntryPayload> = {
      type: 'audit_entry',
      timestamp: new Date().toISOString(),
      payload: { entry },
    };

    for (const [ws, sub] of this.clients) {
      if (this.shouldReceive(sub, entry.target.facilityId, entry.actionCategory as AgentDomain)) {
        this.sendTo(ws, event);
      }
    }
  }

  /**
   * Broadcast an event to all connected clients.
   */
  private broadcast(event: WsEvent): void {
    for (const [ws] of this.clients) {
      this.sendTo(ws, event);
    }
  }

  /**
   * Check if a subscription should receive an event for a given facility/domain.
   */
  private shouldReceive(sub: ClientSubscription, facilityId: string, domain: AgentDomain): boolean {
    if (sub.global) return true;
    if (sub.facilityIds.has(facilityId)) return true;
    if (sub.domains.has(domain)) return true;
    return false;
  }

  /**
   * Send a serialized event to a single WebSocket client.
   */
  private sendTo(ws: WebSocket, event: WsEvent): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  get connectedCount(): number {
    return this.clients.size;
  }
}

// Singleton — imported by route handlers that need to push events
export const connectionManager = new ConnectionManager();

// --- Fastify WebSocket route ---

export async function websocketHandler(server: FastifyInstance): Promise<void> {
  connectionManager.start();

  // Clean up on server close
  server.addHook('onClose', async () => {
    connectionManager.stop();
  });

  server.get(
    '/',
    { websocket: true },
    async (socket: WebSocket, request: FastifyRequest) => {
      // Authenticate via ?token= query param on WebSocket upgrade
      const query = request.query as Record<string, string | undefined>;
      const token = query.token;

      if (!token) {
        socket.close(4001, 'Authentication required: missing token query parameter');
        return;
      }

      try {
        await verifyToken(token);
      } catch {
        socket.close(4001, 'Authentication failed: invalid or expired token');
        return;
      }

      connectionManager.addClient(socket);

      socket.on('message', (data) => {
        const raw = typeof data === 'string' ? data : data.toString();
        connectionManager.handleMessage(socket, raw);
      });

      socket.on('close', () => {
        connectionManager.removeClient(socket);
      });

      socket.on('error', (err) => {
        server.log.error({ err }, 'WebSocket error');
        connectionManager.removeClient(socket);
      });

      // Send welcome message
      const welcome: WsEvent = {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        payload: { message: 'Connected to SNF Decision API' },
      };
      socket.send(JSON.stringify(welcome));
    },
  );
}
