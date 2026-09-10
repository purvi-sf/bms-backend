'use strict';
const { queue, QUEUES } = require('@bms/shared-logger/src/messageQueue');
require('dotenv').config();
const express = require('express');
const client = require('prom-client');
const { createLogger, requestLogger } = require('@bms/shared-logger');

const app = express();
const PORT = process.env.PORT || 3001;
const logger = createLogger('books-service');

// PROMETHEUS METRICS SETUP
// Prometheus is a monitoring system that scrapes metrics from services
// It calls GET /metrics on each service every 15 seconds
// Grafana then reads from Prometheus and displays dashboards

// Collect default Node.js metrics automatically:
// process_cpu_seconds_total, process_heap_bytes, nodejs_eventloop_lag, etc.
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'books_service_' });

// Custom metric 1: Counter -- counts total HTTP requests
// Labels let you filter: show me only POST requests with 201 status
const httpRequestsTotal = new client.Counter({
  name: 'books_http_requests_total',
  help: 'Total number of HTTP requests to the books service',
  labelNames: ['method', 'route', 'status_code'],
  // Prometheus query: books_http_requests_total{method="POST",status_code="201"}
});

// Custom metric 2: Histogram -- measures request duration distribution
// Lets you answer: "what percentage of requests complete within 100ms?"
const httpRequestDuration = new client.Histogram({
  name: 'books_http_request_duration_seconds',
  help: 'Duration of HTTP requests to the books service in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  // buckets: time thresholds in seconds (1ms, 5ms, 10ms, 50ms, etc.)
  // Prometheus records how many requests fell within each bucket
});

// Custom metric 3: Gauge -- current value that can go up or down
// Unlike Counter (only goes up), Gauge tracks current state
const totalBooksGauge = new client.Gauge({
  name: 'books_total_count',
  help: 'Current total number of books in the system',
});

// Middleware to record metrics for every request
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
    httpRequestDuration.observe({
      method: req.method,
      route,
      status_code: res.statusCode,
    }, duration);
  });
  next();
}

// In-memory store -- simulates a database
let books = [
  {
    id: '1',
    title: 'Harry Potter and the Philosophers Stone',
    isbn: '9780747532743',
    genre: 'Fantasy',
    bookType: 'Printed',
    pageCount: 223,
    authorId: '1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Dune',
    isbn: '9780441013593',
    genre: 'Science Fiction',
    bookType: 'Printed',
    pageCount: 412,
    authorId: '2',
    createdAt: new Date().toISOString(),
  },
];
let nextId = 3;

// Update the gauge with current book count
totalBooksGauge.set(books.length);

app.use(express.json());
app.use(requestLogger(logger));
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'books-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bookCount: books.length,
  });
});

// PROMETHEUS METRICS ENDPOINT
// Prometheus server scrapes this endpoint every 15 seconds
// Returns all metrics in Prometheus text format
// Grafana reads from Prometheus to build dashboards
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  const metrics = await client.register.metrics();
  res.end(metrics);
  // Example output:
  // books_http_requests_total{method="GET",route="/books",status_code="200"} 42
  // books_http_request_duration_seconds_bucket{le="0.01"} 38
  // books_total_count 9
});

// GET /books
app.get('/books', (req, res) => {
  req.logger.info('Fetching all books', { count: books.length });
  res.json({ success: true, count: books.length, data: books });
});

// GET /books/:id
app.get('/books/:id', (req, res) => {
  const book = books.find(b => b.id === req.params.id);
  if (!book) {
    req.logger.warn('Book not found', { bookId: req.params.id });
    return res.status(404).json({ success: false, error: 'Book not found' });
  }
  req.logger.info('Book found', { bookId: book.id });
  res.json({ success: true, data: book });
});

// POST /books
app.post('/books', (req, res) => {
  const { title, isbn, genre, bookType, pageCount, authorId } = req.body;
  if (!title || !isbn || !genre || !bookType || !authorId) {
    req.logger.warn('Book creation failed -- missing fields');
    return res.status(400).json({
      success: false,
      error: 'title, isbn, genre, bookType and authorId are required',
    });
  }

  const newBook = {
    id: String(nextId++),
    title, isbn, genre, bookType,
    pageCount: pageCount || null,
    authorId,
    createdAt: new Date().toISOString(),
  };

  books.push(newBook);
  // Publish event to message queue
  // Publish event to message queue
  // Other services (email, analytics, search) can subscribe
  // and react to this event WITHOUT books-service knowing about them
  queue.publish(QUEUES.BOOK_CREATED, {
    bookId: newBook.id,
    title: newBook.title,
    isbn: newBook.isbn,
    authorId: newBook.authorId,
  });
  totalBooksGauge.set(books.length);
  // update Prometheus gauge whenever book count changes

  req.logger.info('Book created', { bookId: newBook.id, title: newBook.title });
  res.status(201).json({ success: true, data: newBook });
});

// PUT /books/:id
app.put('/books/:id', (req, res) => {
  const index = books.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    req.logger.warn('Book update failed -- not found', { bookId: req.params.id });
    return res.status(404).json({ success: false, error: 'Book not found' });
  }

  const allowedFields = ['title', 'isbn', 'genre', 'bookType', 'pageCount', 'authorId'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) books[index][field] = req.body[field];
  });

  req.logger.info('Book updated', { bookId: req.params.id });
  res.json({ success: true, data: books[index] });
});

// DELETE /books/:id
app.delete('/books/:id', (req, res) => {
  const index = books.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    req.logger.warn('Book delete failed -- not found', { bookId: req.params.id });
    return res.status(404).json({ success: false, error: 'Book not found' });
  }

  books.splice(index, 1);
  queue.publish(QUEUES.BOOK_DELETED, { bookId: req.params.id });
  totalBooksGauge.set(books.length);
  // update gauge after deletion

  req.logger.info('Book deleted', { bookId: req.params.id });
  res.json({ success: true, message: 'Book deleted successfully' });
});

app.use((err, req, res, next) => {
  req.logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('Books service started', { port: PORT });
});

module.exports = app;