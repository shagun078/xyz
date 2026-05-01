const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

const VALID_STATUS = new Set(['ON', 'OFF']);
const VALID_COMMANDS = new Set(['START', 'STOP', 'MODE']);

let latestDeviceState = null;
const deviceDataHistory = [];
const deviceCommands = [];
const logs = [];

function getLocalIPv4Addresses() {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(networkInterfaces)) {
    for (const entry of entries || []) {
      if (!entry) continue;
      if (entry.family !== 'IPv4') continue;
      if (entry.internal) continue;
      addresses.push(entry.address);
    }
  }

  return [...new Set(addresses)];
}

function addLog(message) {
  logs.unshift({
    message,
    timestamp: new Date().toISOString(),
  });

  if (logs.length > 10) {
    logs.length = 10;
  }
}

function normalizeIncomingData(payload) {
  return {
    deviceId: String(payload.deviceId || '').trim(),
    status: String(payload.status || '').toUpperCase(),
    pressure: Number(payload.pressure),
    quadrant: Number(payload.quadrant || 1),
    elapsedTime: Number(payload.elapsedTime || 0),
    pressureType: String(payload.pressureType || '').toUpperCase(),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/device-data', (req, res) => {
  const data = normalizeIncomingData(req.body || {});

  if (!data.deviceId || !VALID_STATUS.has(data.status) || Number.isNaN(data.pressure)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload. Expected deviceId, status (ON/OFF), pressure (number).',
    });
  }

  const entry = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  latestDeviceState = entry;
  deviceDataHistory.push(entry);

  if (deviceDataHistory.length > 200) {
    deviceDataHistory.shift();
  }

  addLog(
    `Device ${entry.deviceId} updated: status ${entry.status}, pressure ${entry.pressure}, quadrant ${entry.quadrant}, elapsed ${entry.elapsedTime}s`,
  );

  return res.json({ success: true });
});

app.get('/api/device-data/latest', (_req, res) => {
  if (!latestDeviceState) {
    return res.status(404).json({
      success: false,
      error: 'No device data available yet.',
    });
  }

  return res.json(latestDeviceState);
});

app.post('/api/device-command', (req, res) => {
  const deviceId = String(req.body?.deviceId || '').trim();
  const command = String(req.body?.command || '').toUpperCase();

  if (!deviceId || !VALID_COMMANDS.has(command)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload. Expected deviceId and command (START/STOP/MODE).',
    });
  }

  const commandEntry = {
    deviceId,
    command,
    createdAt: new Date().toISOString(),
    executed: false,
  };

  deviceCommands.push(commandEntry);

  if (deviceCommands.length > 200) {
    deviceCommands.shift();
  }

  addLog(`Command queued for ${deviceId}: ${command}`);

  return res.json({ success: true });
});

app.get('/api/device-command/:deviceId', (req, res) => {
  const deviceId = String(req.params.deviceId || '').trim();

  const pendingCommand = [...deviceCommands]
    .reverse()
    .find((entry) => entry.deviceId === deviceId && entry.executed === false);

  if (!pendingCommand) {
    return res.json({ command: null });
  }

  pendingCommand.executed = true;
  addLog(`Command executed by ${deviceId}: ${pendingCommand.command}`);

  return res.json({ command: pendingCommand.command });
});

app.post('/api/mock-data', (req, res) => {
  const deviceId = String(req.body?.deviceId || 'brush_01').trim();
  const status = Math.random() > 0.2 ? 'ON' : 'OFF';
  const pressure = Math.floor(Math.random() * 431) + 20;
  const elapsedTime = Math.floor(Math.random() * 121);
  const quadrant = Math.min(4, Math.max(1, Math.floor(elapsedTime / 30) + 1));
  const pressureType = pressure > 350 ? 'HIGH' : pressure < 100 ? 'LOW' : 'NORMAL';

  const entry = {
    deviceId,
    status,
    pressure,
    quadrant,
    elapsedTime,
    pressureType,
    timestamp: new Date().toISOString(),
  };

  latestDeviceState = entry;
  deviceDataHistory.push(entry);

  if (deviceDataHistory.length > 200) {
    deviceDataHistory.shift();
  }

  addLog(
    `Mock data generated for ${deviceId}: status ${status}, pressure ${pressure}, quadrant ${quadrant}, elapsed ${elapsedTime}s`,
  );

  return res.json({ success: true, data: entry });
});

app.get('/api/logs', (_req, res) => {
  return res.json({ logs: logs.slice(0, 10) });
});

app.get('/api/summary', (_req, res) => {
  const totalSessions = deviceDataHistory.filter((entry) => entry.status === 'ON').length;
  const lastPressure = latestDeviceState ? latestDeviceState.pressure : null;

  return res.json({
    totalSessions,
    lastPressure,
  });
});

app.listen(PORT, HOST, () => {
  const localIPs = getLocalIPv4Addresses();

  console.log(`Backend listening on http://${HOST}:${PORT}`);

  if (localIPs.length) {
    console.log('LAN URLs:');
    for (const ip of localIPs) {
      console.log(`  http://${ip}:${PORT}`);
    }
  }
});
