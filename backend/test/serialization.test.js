import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Reservation from '../src/models/Reservation.js';

test('user JSON serialization never includes a password hash', () => {
  const user = new User({
    name: 'Demo Member',
    email: 'member@example.test',
    password: 'bcrypt-hash-value',
    role: 'recipient'
  });
  assert.equal(user.toJSON().password, undefined);
});

test('reservation JSON serialization never includes the pickup-code hash', () => {
  const reservation = new Reservation({
    listing: new mongoose.Types.ObjectId(),
    recipient: new mongoose.Types.ObjectId(),
    quantity: 1,
    pickupCodeHash: 'bcrypt-hash-value'
  });
  assert.equal(reservation.toJSON().pickupCodeHash, undefined);
});
