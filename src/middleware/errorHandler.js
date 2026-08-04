const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // 404 from MockAPI — resource not found
  if (err.response?.status === 404) {
    return res.status(404).json({ success: false, error: "Book not found" });
  }

  // other MockAPI errors
  const status = err.response?.status || 500;
  const message = err.response?.data || err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;