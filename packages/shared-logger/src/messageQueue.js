'use strict';

// In-Memory Message Queue -- simulates RabbitMQ/AWS SQS
// In production this would be replaced with:
// - AWS SQS: Amazon's managed message queue service
// - RabbitMQ: open-source message broker
// - Apache Kafka: high-throughput event streaming

// A message queue enables ASYNCHRONOUS communication between services
// Service A publishes a message and immediately returns to the client
// Service B subscribes and processes the message when it's ready
// The two services never directly talk to each other

const { EventEmitter } = require('events');

class MessageQueue extends EventEmitter {
  constructor() {
    super();
    this.queues = {};
    // queues: { "book.created": [message1, message2], ... }
  }

  // Publish a message to a queue
  // This is like AWS SQS sendMessage() or RabbitMQ publish()
  publish(queueName, message) {
    if (!this.queues[queueName]) {
      this.queues[queueName] = [];
    }

    const envelope = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      queueName,
      message,
      publishedAt: new Date().toISOString(),
      attempts: 0,
    };

    this.queues[queueName].push(envelope);

    // Emit event so subscribers immediately process the message
    // In real RabbitMQ/SQS, the broker holds the message until
    // a consumer polls for it -- this simulates that delivery
    this.emit(queueName, envelope);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'message-queue',
      level: 'INFO',
      message: 'Message published',
      queueName,
      messageId: envelope.id,
    }));

    return envelope.id;
  }

  // Subscribe to a queue -- called by services that want to process messages
  // This is like AWS SQS receiveMessage() or RabbitMQ consume()
  subscribe(queueName, handler) {
    if (!this.queues[queueName]) {
      this.queues[queueName] = [];
    }

    this.on(queueName, async (envelope) => {
      envelope.attempts++;
      try {
        await handler(envelope.message, envelope);
        // Remove from queue after successful processing
        this.queues[queueName] = this.queues[queueName]
          .filter(m => m.id !== envelope.id);

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          service: 'message-queue',
          level: 'INFO',
          message: 'Message processed successfully',
          queueName,
          messageId: envelope.id,
        }));
      } catch (err) {
        // In production: implement retry logic and dead letter queues
        // Dead letter queue: messages that fail after max retries
        // go to a separate queue for manual inspection
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          service: 'message-queue',
          level: 'ERROR',
          message: 'Message processing failed',
          queueName,
          messageId: envelope.id,
          error: err.message,
          attempts: envelope.attempts,
        }));
      }
    });
  }

  // Get queue stats -- useful for monitoring
  getStats() {
    const stats = {};
    for (const [name, messages] of Object.entries(this.queues)) {
      stats[name] = { pending: messages.length };
    }
    return stats;
  }
}

// Singleton -- one queue instance shared across the application
// In production, this would be a connection to AWS SQS or RabbitMQ
const queue = new MessageQueue();

// Define queue names as constants -- prevents typos
const QUEUES = {
  BOOK_CREATED: 'book.created',
  BOOK_UPDATED: 'book.updated',
  BOOK_DELETED: 'book.deleted',
  AUTHOR_CREATED: 'author.created',
  AUTHOR_DELETED: 'author.deleted',
};

module.exports = { queue, QUEUES };