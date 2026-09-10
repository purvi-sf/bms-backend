'use strict';

require('dotenv').config();
const express = require('express');
const client = require('prom-client');
const { createLogger, requestLogger } = require('@bms/shared-logger');

const app = express();
const PORT = process.env.PORT || 3003;
const logger = createLogger('categories-service');

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'categories_service_' });

const httpRequestsTotal = new client.Counter({
  name: 'categories_http_requests_total',
  help: 'Total number of HTTP requests to the categories service',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'categories_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const totalCategoriesGauge = new client.Gauge({
  name: 'categories_total_count',
  help: 'Current total number of categories in the system',
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

let categories = [
  { id: '1', name: 'Fiction', description: 'Literary works created from imagination.', createdAt: new Date().toISOString() },
  { id: '2', name: 'Fantasy', description: 'Stories featuring magical elements.', createdAt: new Date().toISOString() },
  { id: '3', name: 'Science Fiction', description: 'Stories based on future science.', createdAt: new Date().toISOString() },
  { id: '4', name: 'Classic', description: 'Books considered of high literary merit.', createdAt: new Date().toISOString() },
  { id: '5', name: 'Adventure', description: 'Stories involving exciting journeys.', createdAt: new Date().toISOString() },
];
let nextId = 6;

totalCategoriesGauge.set(categories.length);

app.use(express.json());
app.use(requestLogger(logger));
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'categories-service', timestamp: new Date().toISOString(), uptime: process.uptime(), categoryCount: categories.length });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/categories', (req, res) => {
  req.logger.info('Fetching all categories', { count: categories.length });
  res.json({ success: true, count: categories.length, data: categories });
});

app.get('/categories/:id', (req, res) => {
  const category = categories.find(c => c.id === req.params.id);
  if (!category) {
    req.logger.warn('Category not found', { categoryId: req.params.id });
    return res.status(404).json({ success: false, error: 'Category not found' });
  }
  res.json({ success: true, data: category });
});

app.post('/categories', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });

  const exists = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    req.logger.warn('Category already exists', { name });
    return res.status(409).json({ success: false, error: 'Category already exists' });
  }

  const newCategory = { id: String(nextId++), name, description: description || null, createdAt: new Date().toISOString() };
  categories.push(newCategory);
  totalCategoriesGauge.set(categories.length);
  req.logger.info('Category created', { categoryId: newCategory.id });
  res.status(201).json({ success: true, data: newCategory });
});

app.put('/categories/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Category not found' });
  if (req.body.name) categories[index].name = req.body.name;
  if (req.body.description) categories[index].description = req.body.description;
  req.logger.info('Category updated', { categoryId: req.params.id });
  res.json({ success: true, data: categories[index] });
});

app.delete('/categories/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Category not found' });
  categories.splice(index, 1);
  totalCategoriesGauge.set(categories.length);
  req.logger.info('Category deleted', { categoryId: req.params.id });
  res.json({ success: true, message: 'Category deleted successfully' });
});

app.use((err, req, res, next) => {
  req.logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('Categories service started', { port: PORT });
});

module.exports = app;