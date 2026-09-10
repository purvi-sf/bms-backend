'use strict';

const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// createLogger uses Winston -- the industry standard Node.js logging library
// Winston provides: log levels, multiple transports, JSON formatting,
// file rotation, and integration with external services like OpenSearch
function createLogger(serviceName) {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    // log level hierarchy: error > warn > info > debug
    // setting 'info' means info, warn, error all get logged
    // debug does NOT get logged unless LOG_LEVEL=debug

    format: winston.format.combine(
      winston.format.timestamp(),
      // adds "timestamp" field to every log entry automatically

      winston.format.errors({ stack: true }),
      // when logging an Error object, include the stack trace

      winston.format.json()
      // output as JSON -- required for OpenSearch ingestion
      // OpenSearch parses JSON and makes every field searchable
    ),

    defaultMeta: { service: serviceName },
    // adds "service": "books-service" to EVERY log entry
    // without having to specify it manually each time

    transports: [
      // Transport 1: Console
      // Shows logs in the terminal during development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          // color-codes log levels: green=info, yellow=warn, red=error
          winston.format.simple()
          // human-readable format for console: "info: message {meta}"
        ),
      }),

      // Transport 2: File -- all logs
      // In production, a log shipper (Fluentd/Logstash) reads this file
      // and sends entries to OpenSearch for storage and analysis
      new winston.transports.File({
        filename: `logs/${serviceName}.log`,
        format: winston.format.json(),
        // always JSON in files -- for OpenSearch ingestion
        maxsize: 5 * 1024 * 1024,
        // 5MB max per file -- prevents disk exhaustion
        maxFiles: 5,
        // keep last 5 rotated files -- automatic log rotation
      }),

      // Transport 3: Error log -- errors only
      // Separate file makes it easy to find all errors across a service
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        // only ERROR level entries go to this file
        format: winston.format.json(),
      }),
    ],
  });

  return logger;
}

// Middleware that attaches a requestId to every incoming HTTP request
// and logs request start and completion
// This implements DISTRIBUTED TRACING -- the same requestId
// is forwarded to downstream services via x-request-id header
function requestLogger(logger) {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    // if API Gateway already set an x-request-id, use it
    // this is what links logs across multiple services for one request
    // if no id exists yet (first service in the chain), generate one

    const startTime = Date.now();

    req.requestId = requestId;
    // attach to req so route handlers can access it for their own logs

    req.logger = logger.child({ requestId });
    // child logger automatically adds requestId to every log entry
    // from this request, without having to pass it manually

    res.setHeader('x-request-id', requestId);
    // return the requestId to the client in the response header
    // clients can report this ID when raising a support ticket

    logger.info('Request received', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 500 ? 'error'
        : res.statusCode >= 400 ? 'warn'
        : 'info';
      // automatically log at the right level based on status code
      // 5xx = error, 4xx = warn, 2xx = info

      logger[level]('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  };
}

module.exports = { createLogger, requestLogger };