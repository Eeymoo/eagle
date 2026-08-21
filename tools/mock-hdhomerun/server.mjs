/**
 * Mock HDHomeRun device server for manual/E2E testing.
 *
 * Emulates the two HTTP endpoints the Eagle plugin uses plus the tuner
 * stream endpoint:
 *   GET /discover.json — device descriptor
 *   GET /lineup.json   — channel lineup
 *   GET /auto/v<ch>    — endless MPEG-TS stream (real device :5004)
 *
 * Real devices announce themselves via UDP broadcast on :65001; that layer
 * is below our HTTP plugin, so it is not emulated.
 *
 * Usage:
 *   node tools/mock-hdhomerun/server.mjs [port]       (default 1954)
 * Then add source in Eagle: HDHomeRun → http://127.0.0.1:1954
 */
import http from 'node:http';

const PORT = Number(process.argv[2] ?? 1954);
const HOST = '127.0.0.1';

const DEVICE = {
  FriendlyName: 'Mock Living Room Tuner',
  Manufacturer: 'Silicondust',
  ModelNumber: 'HDHR4-2DT',
  FirmwareName: 'hdhomerun4_dtv',
  FirmwareVersion: '20250101',
  BaseURL: `http://${HOST}:${PORT}`,
  LineupURL: `http://${HOST}:${PORT}/lineup.json`,
  TunerCount: 2,
  DeviceID: 'MOCK0001',
  DeviceAuth: 'mockauth',
};

// A few realistic DTMB-ish channels with mock TS stream URLs.
const LINEUP = [
  { GuideNumber: '1.1', GuideName: 'CCTV-1 综合', URL: `http://${HOST}:${PORT}/auto/v1.1`, HD: 1 },
  { GuideNumber: '2.1', GuideName: 'CCTV-2 财经', URL: `http://${HOST}:${PORT}/auto/v2.1` },
  { GuideNumber: '3.1', GuideName: 'CCTV-5 体育', URL: `http://${HOST}:${PORT}/auto/v3.1`, HD: 1 },
  { GuideNumber: '4.1', GuideName: '省卫视', URL: `http://${HOST}:${PORT}/auto/v4.1` },
  { GuideNumber: '5.1', GuideName: '本市新闻综合', URL: `http://${HOST}:${PORT}/auto/v5.1` },
];

// 188-byte null TS packets — a valid, decodable-empty transport stream.
const TS_PACKET = Buffer.alloc(188, 0x47);

const server = http.createServer((req, res) => {
  const url = req.url ?? '';

  if (url === '/discover.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(DEVICE));
    return;
  }

  if (url === '/lineup.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(LINEUP));
    return;
  }

  if (url.startsWith('/auto/v')) {
    // Endless TS stream like a real tuner; close on client disconnect.
    res.writeHead(200, {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'no-cache',
      Connection: 'close',
    });
    let closed = false;
    res.on('close', () => { closed = true; });
    const push = () => {
      if (closed) return;
      res.write(Buffer.concat(Array(32).fill(TS_PACKET))); // 6KB chunks
      setTimeout(push, 100);
    };
    push();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, HOST, () => {
  console.log(`mock hdhomerun @ http://${HOST}:${PORT}`);
  console.log(`  discover: http://${HOST}:${PORT}/discover.json`);
  console.log(`  lineup:   http://${HOST}:${PORT}/lineup.json`);
  console.log(`add in Eagle → HDHomeRun → http://${HOST}:${PORT}`);
});
