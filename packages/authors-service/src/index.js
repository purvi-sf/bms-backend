'use strict';

require('dotenv').config();
const express = require('express');
const client = require('prom-client');
const { createLogger, requestLogger } = require('@bms/shared-logger');

const app = express();
const PORT = process.env.PORT || 3002;
const logger = createLogger('authors-service');

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'authors_service_' });

const httpRequestsTotal = new client.Counter({
  name: 'authors_http_requests_total',
  help: 'Total number of HTTP requests to the authors service',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'authors_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const totalAuthorsGauge = new client.Gauge({
  name: 'authors_total_count',
  help: 'Current total number of authors in the system',
});

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
  });
  next();
}

let authors = [
  { id: '1', firstName: 'J.K.', lastName: 'Rowling', email: 'jk@rowling.com', bio: 'British author best known for the Harry Potter series.', createdAt: new Date().toISOString() },
  { id: '2', firstName: 'Frank', lastName: 'Herbert', email: 'frank@herbert.com', bio: 'American science fiction author, best known for Dune.', createdAt: new Date().toISOString() },
];
let nextId = 3;

totalAuthorsGauge.set(authors.length);

app.use(express.json());
app.use(requestLogger(logger));
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'authors-service', timestamp: new Date().toISOString(), uptime: process.uptime(), authorCount: authors.length });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/authors', (req, res) => {
  req.logger.info('Fetching all authors', { count: authors.length });
  res.json({ success: true, count: authors.length, data: authors });
});

app.get('/authors/:id', (req, res) => {
  const author = authors.find(a => a.id === req.params.id);
  if (!author) {
    req.logger.warn('Author not found', { authorId: req.params.id });
    return res.status(404).json({ success: false, error: 'Author not found' });
  }
  req.logger.info('Author found', { authorId: author.id });
  res.json({ success: true, data: author });
});

app.post('/authors', (req, res) => {
  const { firstName, lastName, email, bio } = req.body;
  if (!firstName || !lastName) {
    req.logger.warn('Author creation failed -- missing fields');
    return res.status(400).json({ success: false, error: 'firstName and lastName are required' });
  }

  const newAuthor = {
    id: String(nextId++),
    firstName, lastName,
    email: email || null,
    bio: bio || null,
    createdAt: new Date().toISOString(),
  };

  authors.push(newAuthor);
  totalAuthorsGauge.set(authors.length);
  req.logger.info('Author created', { authorId: newAuthor.id });
  res.status(201).json({ success: true, data: newAuthor });
});

app.put('/authors/:id', (req, res) => {
  const index = authors.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Author not found' });

  const allowedFields = ['firstName', 'lastName', 'email', 'bio'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) authors[index][field] = req.body[field];
  });

  req.logger.info('Author updated', { authorId: req.params.id });
  res.json({ success: true, data: authors[index] });
});

app.delete('/authors/:id', (req, res) => {
  const index = authors.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Author not found' });

  authors.splice(index, 1);
  totalAuthorsGauge.set(authors.length);
  req.logger.info('Author deleted', { authorId: req.params.id });
  res.json({ success: true, message: 'Author deleted successfully' });
});

app.use((err, req, res, next) => {
  req.logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('Authors service started', { port: PORT });
});

module.exports = app;