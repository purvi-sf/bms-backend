const express = require("express");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const bookRoutes = require("./routes/books");
const sequelizeBooksRoutes = require("./routes/sequelize-books");

// Create the Express application
const app = express();

// morgan: logs every incoming request — method, url, status, response time
app.use(morgan("dev"));

// express.json: parses incoming request bodies as JSON — without this, req.body would be undefined
app.use(express.json());

// MockAPI routes
app.use("/api/books", bookRoutes);

// Sequelize routes — uses PostgreSQL directly via ORM
app.use("/api/sq/books", sequelizeBooksRoutes);

// Root route — confirms the server is running
app.get("/", (req, res) => {
  res.json({ message: "BMS API is running" });
});

// 404 Handler — catches any request to a route that doesn't exist
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error Handler — must be registered LAST — catches all errors passed via next(err)
app.use(errorHandler);

module.exports = app;