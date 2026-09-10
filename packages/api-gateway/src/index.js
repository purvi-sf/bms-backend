'use strict';

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { createLogger, requestLogger } = require('@bms/shared-logger');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const logger = createLogger('api-gateway');

const SERVICES = {
  books: process.env.BOOKS_SERVICE_URL || 'http://localhost:3001',
  authors: process.env.AUTHORS_SERVICE_URL || 'http://localhost:3002',
  categories: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3003',
};

app.use(express.json());
app.use(requestLogger(logger));

// Attach requestId to every request
app.use((req, res, next) => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = uuidv4();
  }
  next();
});

// Rate limiting
const requestCounts = {};
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 100;
  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, windowStart: now };
  } else {
    if (now - requestCounts[ip].windowStart > windowMs) {
      requestCounts[ip] = { count: 1, windowStart: now };
    } else {
      requestCounts[ip].count++;
      if (requestCounts[ip].count > maxRequests) {
        logger.warn('Rate limit exceeded', { ip });
        return res.status(429).json({ success: false, error: 'Too many requests' });
      }
    }
  }
  next();
});

// Gateway health check
app.get('/health', async (req, res) => {
  const healthChecks = {};
  for (const [service, url] of Object.entries(SERVICES)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      healthChecks[service] = { status: 'healthy', url, uptime: response.data.uptime };
    } catch (err) {
      healthChecks[service] = { status: 'unhealthy', url, error: err.message };
    }
  }
  const allHealthy = Object.values(healthChecks).every(h => h.status === 'healthy');
  logger.info('Health check performed', { allHealthy });
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    gateway: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: healthChecks,
  });
});

// Generic proxy function
// targetPath is the path on the downstream service
async function proxyRequest(req, res, serviceUrl, serviceName, targetPath) {
  const requestId = req.headers['x-request-id'];
  const targetUrl = `${serviceUrl}${targetPath}`;

  logger.info(`Proxying to ${serviceName}`, {
    requestId,
    method: req.method,
    from: req.originalUrl,
    to: targetUrl,
  });

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      params: req.query,
      timeout: 10000,
    });

    logger.info(`Response from ${serviceName}`, {
      requestId,
      statusCode: response.status,
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      logger.error(`${serviceName} unreachable`, { requestId, error: err.message });
      res.status(503).json({
        success: false,
        error: `${serviceName} is currently unavailable`,
      });
    }
  }
}

// Books routes -- Facade Pattern
// Client calls /api/books, gateway forwards to books-service/books
app.all('/api/books', (req, res) => {
  proxyRequest(req, res, SERVICES.books, 'books-service', '/books');
});

app.all('/api/books/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.books, 'books-service', `/books/${req.params.id}`);
});

// Authors routes
app.all('/api/authors', (req, res) => {
  proxyRequest(req, res, SERVICES.authors, 'authors-service', '/authors');
});

app.all('/api/authors/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.authors, 'authors-service', `/authors/${req.params.id}`);
});

// Categories routes
app.all('/api/categories', (req, res) => {
  proxyRequest(req, res, SERVICES.categories, 'categories-service', '/categories');
});

app.all('/api/categories/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.categories, 'categories-service', `/categories/${req.params.id}`);
});

// 404 for unmatched routes
app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, url: req.url });
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /health',
      'GET POST /api/books',
      'GET PUT DELETE /api/books/:id',
      'GET POST /api/authors',
      'GET PUT DELETE /api/authors/:id',
      'GET POST /api/categories',
      'GET PUT DELETE /api/categories/:id',
    ],
  });
});

app.listen(PORT, () => {
  logger.info('API Gateway started', { port: PORT, services: SERVICES });
  logger.info('Facade Pattern active -- all traffic routed through gateway');
});

module.exports = app;