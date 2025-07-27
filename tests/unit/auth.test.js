const { test, expect } = require('@playwright/test');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

function createRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

test('missing token returns 401', () => {
  const req = { headers: {} };
  const res = createRes();
  let called = false;
  auth(req, res, () => { called = true; });
  expect(res.statusCode).toBe(401);
  expect(res.body.error).toBe('Token required');
  expect(called).toBe(false);
});

test('valid token calls next', () => {
  const token = jwt.sign({ id: 1 }, 'secret');
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createRes();
  let called = false;
  auth(req, res, () => { called = true; });
  expect(res.statusCode).toBe(null);
  expect(called).toBe(true);
  expect(req.user.id).toBe(1);
});
