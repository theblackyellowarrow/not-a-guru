import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FLOW_LABELS,
  HERO_KEY,
  INITIAL_MESSAGES,
  LAST_THREAD_KEY,
  THREAD_MAP_KEY,
  TITLES,
  TOUR_KEY,
  USERNAME_KEY,
  buildPersonalisedGreeting,
  generateErrorRef,
} from '../src/storage.js';

test('storage exposes the expected keys and labels', () => {
  assert.equal(THREAD_MAP_KEY, 'guru_user_threads');
  assert.equal(USERNAME_KEY, 'guru_username');
  assert.equal(HERO_KEY, 'guru_seen_hero');
  assert.equal(TOUR_KEY, 'guru_seen_tour');
  assert.equal(LAST_THREAD_KEY('asha'), 'guru_last_thread_asha');
  assert.equal(TITLES.start_project, 'Build a Problem Statement');
  assert.equal(FLOW_LABELS.final_review, 'Final Roast');
  assert.ok(INITIAL_MESSAGES.start_project.length > 0);
});

test('buildPersonalisedGreeting greets the user by name', () => {
  const withName = buildPersonalisedGreeting('start_project', 'Asha');
  assert.match(withName, /^Welcome, Asha\./);
  const withoutName = buildPersonalisedGreeting('process_review', '');
  assert.equal(withoutName, INITIAL_MESSAGES.process_review);
  const unknownFlow = buildPersonalisedGreeting('mystery', 'Asha');
  assert.match(unknownFlow, /^Welcome, Asha\./);
});

test('generateErrorRef returns an err- prefixed id', () => {
  const ref = generateErrorRef();
  assert.match(ref, /^err-[a-z0-9]+-[a-z0-9]+$/);
  const ids = new Set();
  for (let i = 0; i < 50; i += 1) ids.add(generateErrorRef());
  assert.equal(ids.size, 50);
});

