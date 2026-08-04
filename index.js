require("dotenv").config();
const app = require("./src/app");

// Read port from .env file — falls back to 3000 if not set
const PORT = process.env.PORT || 3000;

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`BMS API server running on http://localhost:${PORT}`);
});