'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const ROOM_TTL_MS = 1000 * 60 * 60 * 8;
const DEVICE_TTL_MS = 1000 * 60 * 10;
const BUMP_WINDOW_MS = 1700;

/** @type {Map<string, {createdAt:number, updatedAt:number, devices:Map<string, any>, lastTransfer:any}>} */
const rooms = new Map();

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function text(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readJson(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function makeRoomCode() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return code;
}

function makeId() {
  return crypto.randomBytes(12).toString('hex');
}

function normalizeRoomCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^2-9A-HJ-NP-Z]/g, '')
    .slice(0, 5);
}

function sanitizeName(value) {
  const name = String(value || '').trim().replace(/[<>]/g, '').slice(0, 20);
  return name || '旅人';
}

function validFlame(flame) {
  if (!flame || typeof flame !== 'object') return null;
  const colors = Array.isArray(flame.colors)
    ? flame.colors.filter((item) => /^#[0-9a-f]{6}$/i.test(String(item))).slice(0, 4)
    : [];
  if (colors.length < 2) return null;

  return {
    id: String(flame.id || makeId()).slice(0, 80),
    type: String(flame.type || 'ember').slice(0, 30),
    name: String(flame.name || '無名之火').slice(0, 30),
    colors,
    seed: Number.isFinite(Number(flame.seed)) ? Number(flame.seed) : crypto.randomInt(1, 1_000_000),
    tempo: Number.isFinite(Number(flame.tempo)) ? Math.max(0, Math.min(999, Number(flame.tempo))) : 0,
    rhythm: Array.isArray(flame.rhythm)
      ? flame.rhythm.map(Number).filter(Number.isFinite).slice(0, 12)
      : [],
    bornAt: Number.isFinite(Number(flame.bornAt)) ? Number(flame.bornAt) : Date.now(),
    origin: String(flame.origin || '').slice(0, 30)
  };
}

function getRoom(code) {
  return rooms.get(normalizeRoomCode(code));
}

function touchDevice(room, deviceId) {
  const device = room?.devices.get(deviceId);
  if (!device) return null;
  device.lastSeen = Date.now();
  room.updatedAt = Date.now();
  return device;
}

function roomState(room, currentDeviceId) {
  const devices = [...room.devices.values()].map((device) => ({
    id: device.id,
    name: device.name,
    hasFlame: Boolean(device.flame),
    flameName: device.flame?.name || null,
    lastSeen: device.lastSeen,
    isCurrent: device.id === currentDeviceId
  }));

  return {
    roomCode: room.code,
    devices,
    current: room.devices.get(currentDeviceId) || null,
    lastTransfer: room.lastTransfer
  };
}

function maybeTransfer(room, bumpingDevice) {
  const now = Date.now();
  const candidates = [...room.devices.values()]
    .filter((device) => device.id !== bumpingDevice.id)
    .filter((device) => now - device.lastSeen < DEVICE_TTL_MS)
    .filter((device) => Math.abs(device.lastBumpAt - bumpingDevice.lastBumpAt) <= BUMP_WINDOW_MS)
    .sort((a, b) => Math.abs(a.lastBumpAt - bumpingDevice.lastBumpAt) - Math.abs(b.lastBumpAt - bumpingDevice.lastBumpAt));

  const partner = candidates[0];
  if (!partner) return null;

  const sourceCandidates = [bumpingDevice, partner].filter((device) => device.flame && device.intent !== 'receive');
  const receiverCandidates = [bumpingDevice, partner].filter((device) => !device.flame || device.intent === 'receive');

  let source = sourceCandidates.find((device) => device.intent === 'send') || null;
  let receiver = receiverCandidates.find((device) => device.id !== source?.id) || null;

  if (!source) {
    if (bumpingDevice.flame && !partner.flame) {
      source = bumpingDevice;
      receiver = partner;
    } else if (partner.flame && !bumpingDevice.flame) {
      source = partner;
      receiver = bumpingDevice;
    }
  }

  if (!source || !receiver || source.id === receiver.id || !source.flame) return null;

  receiver.flame = {
    ...source.flame,
    id: makeId(),
    origin: source.flame.origin || source.name,
    receivedAt: now
  };
  receiver.intent = 'receive';
  source.intent = 'send';

  const transfer = {
    id: makeId(),
    at: now,
    fromId: source.id,
    fromName: source.name,
    toId: receiver.id,
    toName: receiver.name,
    flameName: source.flame.name,
    colors: source.flame.colors
  };
  room.lastTransfer = transfer;
  room.updatedAt = now;
  return transfer;
}

async function handleApi(req, res, pathname, url) {
  try {
    if (req.method === 'POST' && pathname === '/api/join') {
      const body = await readJson(req);
      let roomCode = normalizeRoomCode(body.roomCode);
      if (!roomCode) {
        do roomCode = makeRoomCode(); while (rooms.has(roomCode));
      }

      let room = rooms.get(roomCode);
      if (!room) {
        room = {
          code: roomCode,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          devices: new Map(),
          lastTransfer: null
        };
        rooms.set(roomCode, room);
      }

      const deviceId = makeId();
      room.devices.set(deviceId, {
        id: deviceId,
        name: sanitizeName(body.name),
        flame: null,
        intent: 'receive',
        lastSeen: Date.now(),
        lastBumpAt: 0,
        lastBumpStrength: 0
      });
      room.updatedAt = Date.now();

      return json(res, 200, {
        ok: true,
        roomCode,
        deviceId,
        state: roomState(room, deviceId)
      });
    }

    if (req.method === 'GET' && pathname === '/api/state') {
      const roomCode = normalizeRoomCode(url.searchParams.get('room'));
      const deviceId = String(url.searchParams.get('device') || '');
      const room = getRoom(roomCode);
      if (!room) return json(res, 404, { ok: false, error: '找不到房間' });
      if (!touchDevice(room, deviceId)) return json(res, 404, { ok: false, error: '裝置已離開房間' });
      return json(res, 200, { ok: true, state: roomState(room, deviceId) });
    }

    if (req.method === 'POST' && pathname === '/api/flame') {
      const body = await readJson(req);
      const room = getRoom(body.roomCode);
      if (!room) return json(res, 404, { ok: false, error: '找不到房間' });
      const device = touchDevice(room, String(body.deviceId || ''));
      if (!device) return json(res, 404, { ok: false, error: '找不到裝置' });

      if (body.flame === null) {
        device.flame = null;
        device.intent = 'receive';
      } else {
        const flame = validFlame(body.flame);
        if (!flame) return json(res, 400, { ok: false, error: '火焰資料格式錯誤' });
        device.flame = flame;
        device.intent = 'send';
      }
      return json(res, 200, { ok: true, state: roomState(room, device.id) });
    }

    if (req.method === 'POST' && pathname === '/api/intent') {
      const body = await readJson(req);
      const room = getRoom(body.roomCode);
      if (!room) return json(res, 404, { ok: false, error: '找不到房間' });
      const device = touchDevice(room, String(body.deviceId || ''));
      if (!device) return json(res, 404, { ok: false, error: '找不到裝置' });
      device.intent = body.intent === 'send' ? 'send' : 'receive';
      return json(res, 200, { ok: true, state: roomState(room, device.id) });
    }

    if (req.method === 'POST' && pathname === '/api/bump') {
      const body = await readJson(req);
      const room = getRoom(body.roomCode);
      if (!room) return json(res, 404, { ok: false, error: '找不到房間' });
      const device = touchDevice(room, String(body.deviceId || ''));
      if (!device) return json(res, 404, { ok: false, error: '找不到裝置' });

      device.lastBumpAt = Date.now();
      device.lastBumpStrength = Math.max(0, Math.min(100, Number(body.strength) || 0));
      if (body.intent === 'send' || body.intent === 'receive') device.intent = body.intent;
      const transfer = maybeTransfer(room, device);
      return json(res, 200, {
        ok: true,
        matched: Boolean(transfer),
        transfer,
        state: roomState(room, device.id)
      });
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      return json(res, 200, { ok: true, rooms: rooms.size, time: new Date().toISOString() });
    }

    return json(res, 404, { ok: false, error: 'API 不存在' });
  } catch (error) {
    console.error(error);
    return json(res, 400, { ok: false, error: error.message || '請求失敗' });
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function serveStatic(res, pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = decoded === '/' ? '/index.html' : decoded;
  const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) return text(res, 403, 'Forbidden');

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      const fallback = path.join(PUBLIC_DIR, 'index.html');
      return fs.readFile(fallback, (fallbackError, data) => {
        if (fallbackError) return text(res, 404, 'Not found');
        res.writeHead(200, { 'Content-Type': mimeTypes['.html'], 'Cache-Control': 'no-cache' });
        res.end(data);
      });
    }

    fs.readFile(filePath, (error, data) => {
      if (error) return text(res, 500, 'Server error');
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    return handleApi(req, res, url.pathname, url);
  }
  return serveStatic(res, url.pathname);
});

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    for (const [deviceId, device] of room.devices.entries()) {
      if (now - device.lastSeen > DEVICE_TTL_MS) room.devices.delete(deviceId);
    }
    if (room.devices.size === 0 && now - room.updatedAt > ROOM_TTL_MS) rooms.delete(code);
  }
}, 60_000).unref();

server.listen(PORT, HOST, () => {
  console.log(`\n🔥 傳火計畫已啟動`);
  console.log(`本機：http://localhost:${PORT}`);
  console.log(`同網路手機：請以電腦區域網路 IP 開啟，例如 http://192.168.1.10:${PORT}`);
  console.log('正式使用碰撞感測時，建議部署到 HTTPS 網址。\n');
});
