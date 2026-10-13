import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreMatch } from '../src/services/matching.js';

const now = new Date('2026-10-13T10:00:00.000Z');
const listing = {
  quantity: 20,
  quantityAvailable: 20,
  allergens: ['peanuts'],
  pickupStart: '2026-10-13T11:00:00.000Z',
  deadline: '2026-10-13T14:00:00.000Z'
};
const recipient = {
  organization: {
    capacity: 20,
    dietaryNeeds: [],
    pickupAvailability: ['2026-10-13T12:00:00.000Z']
  }
};

test('scores matches using the configured weighted components', () => {
  const match = scoreMatch(listing, recipient, now);
  assert.deepEqual(match.weights, {
    pickupFeasibility: 0.35,
    capacity: 0.3,
    deadline: 0.25,
    dietary: 0.1
  });
  assert.equal(match.components.pickupFeasibility, 100);
  assert.equal(match.components.capacity, 100);
  assert.equal(match.components.dietary, 100);
  assert.equal(match.score, 99);
  assert.equal(match.eligible, true);
  assert.equal(match.explanation.length, 4);
});

test('excludes a listing that conflicts with recipient allergen restrictions', () => {
  const match = scoreMatch(listing, {
    organization: { ...recipient.organization, dietaryNeeds: ['Peanuts'] }
  }, now);
  assert.equal(match.components.dietary, 0);
  assert.equal(match.eligible, false);
});

test('excludes past-deadline, full, zero-capacity, and infeasible pickup matches', () => {
  assert.equal(scoreMatch({ ...listing, deadline: '2026-10-13T09:59:00.000Z' }, recipient, now).eligible, false);
  assert.equal(scoreMatch({ ...listing, quantityAvailable: 0 }, recipient, now).eligible, false);
  assert.equal(scoreMatch(listing, { organization: { ...recipient.organization, capacity: 0 } }, now).eligible, false);
  assert.equal(scoreMatch(listing, {
    organization: { ...recipient.organization, pickupAvailability: ['2026-10-13T15:00:00.000Z'] }
  }, now).eligible, false);
});
