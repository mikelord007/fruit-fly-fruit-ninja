import test from 'node:test';
import assert from 'node:assert/strict';
import { fitRidge } from '../src/ridge.js';

test('recovers two known linear readouts', () => {
  const x = [];
  const y = [];
  for (let i = -20; i <= 20; i++) {
    const a = i / 7;
    const b = ((i * 13) % 17) / 5;
    x.push([1, a, b]);
    y.push([2 + 3 * a - 0.5 * b, -1 + 0.25 * a + 4 * b]);
  }
  const [wx, wy] = fitRidge(x, y, 1e-10);
  const expectedX = [2, 3, -0.5];
  const expectedY = [-1, 0.25, 4];
  wx.forEach((value, i) => assert.ok(Math.abs(value - expectedX[i]) < 1e-7));
  wy.forEach((value, i) => assert.ok(Math.abs(value - expectedY[i]) < 1e-7));
});

test('returns finite weights for duplicate and zero features', () => {
  const x = Array.from({ length: 30 }, (_, i) => [1, i, i, 0, 1e-12 * i]);
  const y = x.map((_, i) => [i * 2, -i]);
  const weights = fitRidge(x, y, 0);
  assert.equal(weights.length, 2);
  assert.equal(weights[0].length, 5);
  assert.ok(weights.every(vector => [...vector].every(Number.isFinite)));
});
