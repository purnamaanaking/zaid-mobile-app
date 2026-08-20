import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isValidTime, nextWeeklyTrigger, WEEKDAY_BY_DAY } from './reminder.ts';

test('maps UI day names to expo WEEKLY weekday (1 = Sunday)', () => {
  assert.equal(WEEKDAY_BY_DAY.sunday, 1);
  assert.equal(WEEKDAY_BY_DAY.monday, 2);
  assert.equal(WEEKDAY_BY_DAY.saturday, 7);
});

test('isValidTime accepts HH:MM, rejects bad input', () => {
  assert.equal(isValidTime('08:00'), true);
  assert.equal(isValidTime('23:59'), true);
  assert.equal(isValidTime('8:00'), false);
  assert.equal(isValidTime('25:00'), false);
  assert.equal(isValidTime('12:60'), false);
  assert.equal(isValidTime('abc'), false);
});

test('nextWeeklyTrigger returns the configured hour/minute', () => {
  const d = nextWeeklyTrigger('friday', '18:30');
  assert.equal(d.getHours(), 18);
  assert.equal(d.getMinutes(), 30);
  assert.equal(d.getSeconds(), 0);
});

test('nextWeeklyTrigger lands on the configured weekday (JS: 0=Sun..6=Sat)', () => {
  assert.equal(nextWeeklyTrigger('friday', '18:30').getDay(), 5);
  assert.equal(nextWeeklyTrigger('sunday', '08:00').getDay(), 0);
});

test('nextWeeklyTrigger is always in the future', () => {
  const now = new Date();
  const d = nextWeeklyTrigger('monday', '08:00');
  assert.ok(d.getTime() > now.getTime());
  assert.ok(d.getTime() - now.getTime() <= 7 * 24 * 3600 * 1000);
});
