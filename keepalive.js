const axios = require('axios');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const PING_INTERVAL = 2000; // 2 seconds
const HEALTH_ENDPOINT = '/health';

// Simple health check endpoint handler (add this to your server.js)
// app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));

let pingCount = 0;
let errorCount = 0;

const pingServer = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}${HEALTH_ENDPOINT}`, {
      timeout: 5000
    });
    
    pingCount++;
    console.log(`✓ Ping #${pingCount} successful at ${new Date().toLocaleTimeString()}`);
    
    if (errorCount > 0) {
      console.log(`Server recovered after ${errorCount} errors`);
      errorCount = 0;
    }
  } catch (error) {
    errorCount++;
    console.error(`✗ Ping failed (${errorCount}): ${error.message}`);
  }
};

// Start pinging
console.log(`Starting keepalive service...`);
console.log(`Target: ${SERVER_URL}${HEALTH_ENDPOINT}`);
console.log(`Interval: ${PING_INTERVAL}ms\n`);

// Initial ping
pingServer();

// Set interval for regular pings
setInterval(pingServer, PING_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\nShutting down keepalive service...`);
  console.log(`Total pings sent: ${pingCount}`);
  process.exit(0);
});
