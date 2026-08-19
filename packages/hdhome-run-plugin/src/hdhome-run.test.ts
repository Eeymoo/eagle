import { describe, expect, it } from 'vitest';
import { MemoryPort } from '@eagle/core';
import { hdHomeRunPlugin, discoverDevice } from './hdhome-run.js';

const DEVICE = {
  FriendlyName: 'Living Room',
  BaseURL: 'http://192.168.1.50:80',
  LineupURL: 'http://192.168.1.50:80/lineup.json',
  TunerCount: 2,
  DeviceID: 'ABCDEF01',
};

const LINEUP = [
  { GuideNumber: '2.1', GuideName: 'CBS', URL: 'http://192.168.1.50:5004/auto/v2.1' },
  { GuideNumber: '4.1', GuideName: 'NBC', URL: 'http://192.168.1.50:5004/auto/v4.1', HD: 1 },
];

describe('HDHomeRun', () => {
  it('discovers a device from /discover.json', async () => {
    const port = new MemoryPort().stubJson('http://hdhr.local/discover.json', DEVICE);
    const device = await discoverDevice(port, 'hdhr.local');
    // The device-reported BaseURL is authoritative.
    expect(device.BaseURL).toBe('http://192.168.1.50:80');
    expect(device.FriendlyName).toBe('Living Room');
  });

  it('lists channels from the lineup', async () => {
    const port = new MemoryPort().stubJson(DEVICE.LineupURL!, LINEUP);
    const source = hdHomeRunPlugin.create(port, {
      id: 'hdhome-run:ABCDEF01',
      label: 'Living Room',
      state: { deviceUrl: 'http://192.168.1.50', device: DEVICE },
    });
    const { channels } = await source.listChannels();
    expect(channels.map((c) => c.id)).toEqual(['hdhr:2.1', 'hdhr:4.1']);
    expect(channels[1]?.group).toBe('HD');
  });

  it('resolves the lineup stream URL directly', async () => {
    const port = new MemoryPort().stubJson(DEVICE.LineupURL!, LINEUP);
    const source = hdHomeRunPlugin.create(port, {
      id: 'hdhome-run:ABCDEF01',
      label: 'Living Room',
      state: { deviceUrl: 'http://192.168.1.50', device: DEVICE },
    });
    const stream = await source.resolveStream('hdhr:4.1');
    expect(stream.url).toBe('http://192.168.1.50:5004/auto/v4.1');
    expect(stream.kind).toBe('hdhomerun');
  });

  it('connect probes discover.json and derives DeviceID-based id', async () => {
    const port = new MemoryPort().stubJson('http://192.168.1.50/discover.json', DEVICE);
    const conn = await hdHomeRunPlugin.connect(port, { deviceUrl: 'http://192.168.1.50' });
    expect(conn.id).toBe('hdhome-run:ABCDEF01');
    expect(conn.label).toBe('Living Room');
  });
});
