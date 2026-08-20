import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const authFlowSource = readFileSync(
  resolve('src/features/auth/pages/AuthFlowPage.tsx'),
  'utf8',
);

test('successful auth redirects immediately without waiting for local splash state', () => {
  assert.doesNotMatch(authFlowSource, /showSuccessSplash|setShowSuccessSplash/);
});
