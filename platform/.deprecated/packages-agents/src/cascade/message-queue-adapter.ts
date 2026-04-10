import type { AgentEvent } from '@snf/core';

import type { EventHandler } from '../event-bus.js';
import { EventBus } from '../event-bus.js';

// ─── Adapter Interface ───────────────────────────────────

/**
 * MessageQueueAdapter — abstract interface for production message queue backends.
 *
 * The cascade system uses this interface to publish and subscribe to events.
 * In development, InMemoryAdapter wraps the existing EventBus.
 * In production, swap to SQS or Azure Service Bus.
 */
export interface MessageQueueAdapter {
  /** Publish an event to the queue/topic */
  publish(event: AgentEvent): Promise<void>;

  /** Subscribe to events of a specific type */
  subscribe(eventType: string, handler: EventHandler): Promise<void>;

  /** Acknowledge successful processing of an event */
  ack(eventId: string): Promise<void>;

  /** Negative-acknowledge (return to queue for redelivery) */
  nack(eventId: string): Promise<void>;

  /** Health check — is the adapter connected? */
  isHealthy(): Promise<boolean>;

  /** Graceful shutdown */
  close(): Promise<void>;
}

// ─── InMemoryAdapter ─────────────────────────────────────

/**
 * InMemoryAdapter — wraps the existing EventBus for development/testing.
 * No external dependencies. Events are not durable across restarts.
 */
export class InMemoryAdapter implements MessageQueueAdapter {
  private eventBus: EventBus;
  private ackedEvents: Set<string> = new Set();

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? new EventBus();
  }

  async publish(event: AgentEvent): Promise<void> {
    await this.eventBus.publish(event);
  }

  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    this.eventBus.subscribe(`adapter-${eventType}`, [eventType], handler);
  }

  async ack(eventId: string): Promise<void> {
    this.ackedEvents.add(eventId);
  }

  async nack(_eventId: string): Promise<void> {
    // In-memory: nack is a no-op. Events are delivered synchronously.
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> {
    this.eventBus.reset();
    this.ackedEvents.clear();
  }

  /** Get the underlying EventBus (for testing/inspection) */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

// ─── SQSAdapter (Stub) ──────────────────────────────────

/**
 * SQSAdapter — AWS SQS/SNS adapter stub.
 *
 * Production implementation would use @aws-sdk/client-sqs and @aws-sdk/client-sns.
 * Each event type maps to an SNS topic, with SQS queues per subscriber agent.
 *
 * Environment variables:
 *   AWS_REGION, AWS_SQS_QUEUE_URL_PREFIX, AWS_SNS_TOPIC_ARN_PREFIX
 */
export class SQSAdapter implements MessageQueueAdapter {
  private region: string;
  private queueUrlPrefix: string;
  private topicArnPrefix: string;

  constructor() {
    this.region = process.env['AWS_REGION'] ?? 'us-east-1';
    this.queueUrlPrefix = process.env['AWS_SQS_QUEUE_URL_PREFIX'] ?? '';
    this.topicArnPrefix = process.env['AWS_SNS_TOPIC_ARN_PREFIX'] ?? '';
  }

  async publish(event: AgentEvent): Promise<void> {
    // Stub: In production, publish to SNS topic
    // const sns = new SNSClient({ region: this.region });
    // const topicArn = `${this.topicArnPrefix}/${event.eventType.replace('.', '-')}`;
    // await sns.send(new PublishCommand({ TopicArn: topicArn, Message: JSON.stringify(event) }));
    void event;
    void this.topicArnPrefix;
    throw new Error('SQSAdapter.publish() is a stub. Install @aws-sdk/client-sns and implement.');
  }

  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    // Stub: In production, poll SQS queue and invoke handler
    // const sqs = new SQSClient({ region: this.region });
    // const queueUrl = `${this.queueUrlPrefix}/${eventType.replace('.', '-')}`;
    // Start long-polling loop...
    void eventType;
    void handler;
    void this.queueUrlPrefix;
    throw new Error('SQSAdapter.subscribe() is a stub. Install @aws-sdk/client-sqs and implement.');
  }

  async ack(eventId: string): Promise<void> {
    // Stub: In production, delete message from SQS queue
    // await sqs.send(new DeleteMessageCommand({ QueueUrl, ReceiptHandle }));
    void eventId;
    throw new Error('SQSAdapter.ack() is a stub. Install @aws-sdk/client-sqs and implement.');
  }

  async nack(eventId: string): Promise<void> {
    // Stub: In production, change message visibility timeout to 0 for immediate redelivery
    // await sqs.send(new ChangeMessageVisibilityCommand({ QueueUrl, ReceiptHandle, VisibilityTimeout: 0 }));
    void eventId;
    throw new Error('SQSAdapter.nack() is a stub. Install @aws-sdk/client-sqs and implement.');
  }

  async isHealthy(): Promise<boolean> {
    // Stub: In production, call sqs.send(new GetQueueAttributesCommand(...))
    void this.region;
    return false;
  }

  async close(): Promise<void> {
    // Stub: Clean up SQS long-polling connections
  }
}

// ─── ServiceBusAdapter (Stub) ────────────────────────────

/**
 * ServiceBusAdapter — Azure Service Bus adapter stub.
 *
 * Production implementation would use @azure/service-bus.
 * Each event type maps to a topic, with subscriptions per subscriber agent.
 *
 * Environment variables:
 *   AZURE_SERVICEBUS_CONNECTION_STRING, AZURE_SERVICEBUS_NAMESPACE
 */
export class ServiceBusAdapter implements MessageQueueAdapter {
  private connectionString: string;
  private namespace: string;

  constructor() {
    this.connectionString = process.env['AZURE_SERVICEBUS_CONNECTION_STRING'] ?? '';
    this.namespace = process.env['AZURE_SERVICEBUS_NAMESPACE'] ?? '';
  }

  async publish(event: AgentEvent): Promise<void> {
    // Stub: In production, send to Service Bus topic
    // const client = new ServiceBusClient(this.connectionString);
    // const sender = client.createSender(event.eventType.replace('.', '-'));
    // await sender.sendMessages({ body: event });
    void event;
    void this.connectionString;
    throw new Error('ServiceBusAdapter.publish() is a stub. Install @azure/service-bus and implement.');
  }

  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    // Stub: In production, create subscription receiver
    // const client = new ServiceBusClient(this.connectionString);
    // const receiver = client.createReceiver(topicName, subscriptionName);
    // receiver.subscribe({ processMessage: async (msg) => handler(msg.body), ... });
    void eventType;
    void handler;
    void this.namespace;
    throw new Error('ServiceBusAdapter.subscribe() is a stub. Install @azure/service-bus and implement.');
  }

  async ack(eventId: string): Promise<void> {
    // Stub: In production, complete the message
    // await receiver.completeMessage(message);
    void eventId;
    throw new Error('ServiceBusAdapter.ack() is a stub. Install @azure/service-bus and implement.');
  }

  async nack(eventId: string): Promise<void> {
    // Stub: In production, abandon the message for redelivery
    // await receiver.abandonMessage(message);
    void eventId;
    throw new Error('ServiceBusAdapter.nack() is a stub. Install @azure/service-bus and implement.');
  }

  async isHealthy(): Promise<boolean> {
    // Stub: In production, check connection state
    void this.connectionString;
    return false;
  }

  async close(): Promise<void> {
    // Stub: Close Service Bus client connections
  }
}

// ─── Factory ─────────────────────────────────────────────

export type MessageQueueProvider = 'in-memory' | 'sqs' | 'service-bus';

/**
 * Create a message queue adapter based on environment configuration.
 *
 * Reads SNF_MQ_PROVIDER env var. Defaults to 'in-memory' for development.
 */
export function createMessageQueueAdapter(
  provider?: MessageQueueProvider,
  eventBus?: EventBus,
): MessageQueueAdapter {
  const resolvedProvider = provider ?? (process.env['SNF_MQ_PROVIDER'] as MessageQueueProvider) ?? 'in-memory';

  switch (resolvedProvider) {
    case 'sqs':
      return new SQSAdapter();
    case 'service-bus':
      return new ServiceBusAdapter();
    case 'in-memory':
    default:
      return new InMemoryAdapter(eventBus);
  }
}
