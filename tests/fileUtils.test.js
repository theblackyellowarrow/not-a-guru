import test from 'node:test';
import assert from 'node:assert/strict';

import { parseUploadedFile } from '../src/fileUtils.js';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function makeFile({ name = 'asset.png', type = 'image/png', size = 1024 } = {}) {
  return { name, type, size };
}

test('parseUploadedFile rejects oversized files before touching any library', async () => {
  const file = makeFile({ size: MAX_FILE_SIZE + 1 });
  await assert.rejects(
    () => parseUploadedFile(file),
    /File too large/
  );
});

test('parseUploadedFile rejects unsupported MIME types with a clear message', async () => {
  const file = makeFile({ name: 'thing.zip', type: 'application/zip', size: 100 });
  await assert.rejects(
    () => parseUploadedFile(file),
    /Unsupported file type: application\/zip/
  );
});

test('parseUploadedFile rejects when MIME type is missing entirely', async () => {
  const file = makeFile({ name: 'mystery', type: '', size: 100 });
  await assert.rejects(
    () => parseUploadedFile(file),
    /Unsupported file type: unknown/
  );
});

test('parseUploadedFile converts an image to base64 with the data URL prefix stripped', async () => {
  const file = makeFile({ name: 'photo.jpg', type: 'image/jpeg', size: 2048 });

  const previousFileReader = globalThis.FileReader;
  class StubFileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
      this.onerror = null;
    }
    readAsDataURL() {
      this.result = 'data:image/jpeg;base64,QUJDRA==';
      this.onloadend?.();
    }
  }
  globalThis.FileReader = StubFileReader;

  try {
    const parsed = await parseUploadedFile(file);
    assert.deepEqual(parsed, {
      name: 'photo.jpg',
      type: 'image/jpeg',
      base64: 'QUJDRA==',
    });
  } finally {
    if (previousFileReader === undefined) delete globalThis.FileReader;
    else globalThis.FileReader = previousFileReader;
  }
});
