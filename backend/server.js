const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3000;

// Enable CORS for frontend and ESP32 requests.
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage for the latest WiFi scan results.
let latestData = [];

const getAccessibleUrls = (port) => {
  const interfaces = os.networkInterfaces();
  const urls = [];

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        urls.push(`http://${address.address}:${port}`);
      }
    }
  }

  return urls;
};

// POST /data receives an array of WiFi objects from the ESP32.
app.post('/data', (req, res) => {
  const data = req.body;
  console.log('📡 POST /data request received from:', req.ip);

  // Validate payload shape.
  if (!Array.isArray(data)) {
    console.log('Received invalid payload:', data);
    return res.status(400).json({ error: 'Expected an array of { ssid, rssi } objects.' });
  }

  const normalized = data
    .filter(item => item && typeof item.ssid === 'string' && typeof item.rssi === 'number')
    .map(item => ({
      ssid: item.ssid,
      rssi: item.rssi,
      channel: Number.isFinite(Number(item.channel)) ? Number(item.channel) : null,
      encryption: typeof item.encryption === 'string' ? item.encryption : 'UNKNOWN',
    }));

  latestData = normalized.map((item, i) => ({ ...item, id: i, timestamp: Date.now() }));
  console.log(`✅ Stored ${normalized.length} networks from ${req.ip}`);

  res.json({ status: 'ok', count: normalized.length });
});

// GET /health for connectivity test
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// GET /data returns the latest stored WiFi scan results.
app.get('/data', (req, res) => {
  res.json(latestData);
});

// GET /status for health check
app.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    networks: latestData.length, 
    timestamp: Date.now(),
    sample: latestData.slice(0,3)
  });
});

// Start the server.
app.listen(PORT, '0.0.0.0', () => {
  const urls = getAccessibleUrls(PORT);

  console.log(`IoT WiFi dashboard backend running on http://0.0.0.0:${PORT}`);
  if (urls.length) {
    console.log(`Accessible URLs: ${urls.join(', ')}`);
  }
});
