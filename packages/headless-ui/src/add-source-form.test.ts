import { describe, expect, it, vi } from 'vitest';
import { AddSourceFormController } from './add-source-form.js';
import type { SourcePlugin } from '@eagle/core';

const plugins: SourcePlugin[] = [
  {
    kind: 'jellyfin',
    displayName: 'Jellyfin',
    channelIdPrefix: 'jf',
    formFields: [
      { key: 'serverUrl', label: '服务器地址' },
      { key: 'username', label: '用户名' },
      { key: 'password', label: '密码', secure: true },
    ],
    connect: vi.fn(),
    create: vi.fn() as never,
  },
  {
    kind: 'm3u-tuner',
    displayName: 'M3U Tuner',
    channelIdPrefix: 'm3u',
    formFields: [{ key: 'playlistUrl', label: 'M3U URL' }],
    connect: vi.fn(),
    create: vi.fn() as never,
  },
];

function makeController() {
  return new AddSourceFormController({
    plugins,
    submit: vi.fn().mockResolvedValue({ id: 'x', label: 'x', state: {} }),
  });
}

describe('AddSourceFormController', () => {
  it('switching plugins clears values', () => {
    const c = makeController();
    c.select('jellyfin');
    c.setValue('serverUrl', 'http://a');
    c.select('m3u-tuner');
    expect(c.getState().values).toEqual({});
    expect(c.activePlugin()?.kind).toBe('m3u-tuner');
  });

  it('blocks submit when required fields empty', async () => {
    const c = makeController();
    c.select('jellyfin');
    await c.submit();
    expect(c.getState().status).toBe('error');
    expect(c.getState().errorMessage).toContain('必填');
  });

  it('submits trimmed values on success path', async () => {
    const c = makeController();
    c.select('jellyfin');
    c.setValue('serverUrl', '  http://jf.local  ');
    c.setValue('username', 'alice');
    c.setValue('password', 'pw');
    await c.submit();
    expect(c.getState().status).toBe('success');
  });

  it('captures submit errors', async () => {
    const c = new AddSourceFormController({
      plugins,
      submit: vi.fn().mockRejectedValue(new Error('connect boom')),
    });
    c.select('m3u-tuner');
    c.setValue('playlistUrl', 'http://x/y.m3u');
    await c.submit();
    expect(c.getState().status).toBe('error');
    expect(c.getState().errorMessage).toBe('connect boom');
  });

  it('reset returns to idle', async () => {
    const c = makeController();
    c.select('m3u-tuner');
    c.setValue('playlistUrl', 'http://x');
    await c.submit();
    c.reset();
    expect(c.getState().status).toBe('idle');
    expect(c.getState().values).toEqual({});
  });
});
