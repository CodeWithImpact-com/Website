'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ML = require('../ml-engine.js');

function close(actual, expected, tolerance = 1e-7) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should equal ${expected} ± ${tolerance}`);
}

test('seeded synthetic days are reproducible, bounded and exclusive to each split', () => {
  const splits = ML.data();
  assert.deepEqual(splits, ML.data(42));
  assert.notDeepEqual(splits, ML.data(43));
  assert.equal(splits.train.length, 24);
  assert.equal(splits.validation.length, 12);
  assert.equal(splits.test.length, 12);
  const all = [...splits.train, ...splits.validation, ...splits.test];
  assert.equal(new Set(all.map(point => point[0])).size, 48);
  all.forEach(([x, y]) => { assert.ok(x >= 0 && x <= 100); assert.ok(y >= 0 && y <= 170); });
  for (const points of Object.values(splits)) {
    assert.ok(Math.min(...points.map(point => point[0])) < 10);
    assert.ok(Math.max(...points.map(point => point[0])) > 90);
  }
  splits.train[0][1] = -99;
  assert.notEqual(ML.data().train[0][1], -99, 'each request returns fresh arrays');
});

test('linear regression recovers an exact line and handles a constant input', () => {
  const predict = ML.fitLinear([[-4, -9], [0, 3], [2, 9], [10, 33]]);
  close(predict(5), 18);
  close(ML.mae([[-4, -9], [0, 3], [2, 9], [10, 33]], predict), 0);
  close(ML.fitLinear([[7, 2], [7, 8]])(100), 5);
  close(ML.fitLinear([[2, 5]])(30), 5);
});

test('normalized polynomial fitting recovers a known quadratic in visitor units', () => {
  const target = x => 5 + 0.3 * x + 0.008 * x * x;
  const points = Array.from({ length: 16 }, (_, i) => [i * 6, target(i * 6)]);
  const snapshot = structuredClone(points);
  const predict = ML.fitPolynomial(points, 2);
  [0, 13, 50, 90].forEach(x => close(predict(x), target(x), 1e-6));
  assert.deepEqual(points, snapshot, 'fit does not mutate the observed data');
});

test('degree-nine fits stay finite and handle constant or sparse observations', () => {
  const splits = ML.data();
  const predict = ML.fitPolynomial(splits.train, 9);
  for (let x = 0; x <= 100; x += 0.5) assert.ok(Number.isFinite(predict(x)));
  close(ML.fitPolynomial([[0, 17], [30, 17], [100, 17]], 9)(53), 17, 1e-6);
  close(ML.fitPolynomial([[4, 3], [4, 9]], 9)(100), 6);
  assert.ok(Number.isFinite(ML.fitPolynomial([[0, 0], [100, 100]], 9)(20)));
  close(ML.fitPolynomial(splits.train, 1)(35), ML.fitLinear(splits.train)(35), 1e-6);
});

test('the mean baseline, nearest neighbours and MAE use the requested training points', () => {
  const points = [[0, 10], [10, 20], [30, 60]];
  close(ML.meanModel(points)(999), 30);
  close(ML.fitKNN(points, 1)(9), 20);
  close(ML.fitKNN(points, 2)(2), 15);
  close(ML.fitKNN(points, 100)(2), 30);
  close(ML.fitKNN(points, 1)(5), 10, 0); // Stable original-order tie break.
  const frozenFit = ML.fitKNN(points, 1);
  points[1][1] = 999;
  close(frozenFit(10), 20);
  close(ML.mae([[0, 10], [1, 30]], () => 15), 10);
});

test('a fitted line beats a naive mean on the untouched synthetic validation set', () => {
  const { train, validation } = ML.data();
  assert.ok(ML.mae(validation, ML.fitLinear(train)) < ML.mae(validation, ML.meanModel(train)) / 2);
});

test('threshold endpoints and inclusive boundary produce correct confusion counts', () => {
  const cases = ML.classificationCases();
  const positives = cases.filter(item => item.y).length;
  const all = ML.confusion(cases, 0);
  assert.equal(all.tp, positives);
  assert.equal(all.fp, cases.length - positives);
  assert.equal(all.recall, 1);
  assert.equal(all.flagged, cases.length);
  const none = ML.confusion(cases, 1);
  assert.equal(none.flagged, 0);
  assert.equal(none.precision, 0);
  assert.equal(none.recall, 0);
  assert.equal(none.fn, positives);
  assert.deepEqual(ML.confusion(cases, 0.5), {
    tp: 6, fp: 1, tn: 6, fn: 3, precision: 6 / 7, recall: 2 / 3, accuracy: 0.75, flagged: 7
  });
  assert.equal(ML.confusion([{ p: 0.5, y: 1 }], 0.5).tp, 1);
  assert.equal(ML.confusion([], 0.5).accuracy, 0);
});

test('lowering a threshold never reduces the number of flagged days or recall', () => {
  const cases = ML.classificationCases();
  let previous = ML.confusion(cases, 1);
  for (let tick = 99; tick >= 0; tick -= 1) {
    const current = ML.confusion(cases, tick / 100);
    assert.ok(current.flagged >= previous.flagged);
    assert.ok(current.recall >= previous.recall);
    previous = current;
  }
});

test('k-means finds known centres and reports squared-distance inertia', () => {
  const points = [[0, 0], [0, 2], [10, 0], [10, 2]];
  const snapshot = structuredClone(points);
  const result = ML.kmeans(points, 2);
  assert.deepEqual(result.centres, [[0, 1], [10, 1]]);
  assert.deepEqual(result.assignments, [0, 0, 1, 1]);
  close(result.inertia, 4);
  assert.deepEqual(points, snapshot);
  assert.deepEqual(result, ML.kmeans(points, 2));
});

test('k-means handles one group, duplicated coordinates and an iteration budget', () => {
  const points = ML.locations();
  const single = ML.kmeans(points, 1);
  close(single.centres[0][0], points.reduce((sum, p) => sum + p[0], 0) / points.length);
  close(single.centres[0][1], points.reduce((sum, p) => sum + p[1], 0) / points.length);
  assert.deepEqual(ML.kmeans([[2, 3], [2, 3], [2, 3]], 3).assignments, [0, 0, 0]);
  for (const budget of [1, 30]) {
    const result = ML.kmeans(points, 4, budget);
    close(result.inertia, points.reduce((sum, point, index) => {
      const centre = result.centres[result.assignments[index]];
      const distance = (point[0] - centre[0]) ** 2 + (point[1] - centre[1]) ** 2;
      assert.ok(result.centres.every(c => distance <= (point[0] - c[0]) ** 2 + (point[1] - c[1]) ** 2 + 1e-8));
      return sum + distance;
    }, 0));
  }
  assert.ok(ML.kmeans(points, 3).inertia < single.inertia);
});

test('CSV output preserves the displayed original numbers with a useful header', () => {
  assert.equal(ML.csv([[10.2, 22], [30, 45.5]]), 'expected_visitors,meals_needed\n10.2,22\n30,45.5\n');
});

test('invalid training points are rejected and the browser global matches the Node API', () => {
  assert.throws(() => ML.fitLinear([]), RangeError);
  assert.throws(() => ML.fitPolynomial([[NaN, 3]], 3), TypeError);
  assert.throws(() => ML.confusion([{ p: 2, y: 1 }], 0.5), TypeError);
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'ml-engine.js'), 'utf8'), context);
  assert.equal(typeof context.window.MLEngine.fitPolynomial, 'function');
  close(context.window.MLEngine.fitLinear([[0, 2], [10, 22]])(5), 12);
});

test('logistic regression recovers a rising relationship and gives probabilities between 0 and 1', () => {
  const d = ML.busyDays(), model = ML.fitLogistic(d.train);
  assert.ok(model.slope > 0);
  assert.ok(model.midpoint > 30 && model.midpoint < 75);
  for (const x of [0, 50, 100]) { const p = model(x); assert.ok(p > 0 && p < 1); }
  assert.ok(model(20) < 0.5 && model(90) > 0.5);
  const cases = ML.logisticCases();
  assert.equal(cases.length, d.validation.length);
  assert.ok(cases.every((c, i) => i === 0 || c.p >= cases[i - 1].p));
});

test('trees, forests and boosting improve on the mean and deeper trees fit training data better', () => {
  const D = ML.data(42), mean = ML.mae(D.validation, ML.meanModel(D.train));
  const err = depth => ML.mae(D.train, ML.fitTree(D.train, depth));
  assert.ok(err(1) > err(2) && err(2) > err(3));
  assert.equal(ML.fitTree(D.train, 0)(50), ML.meanModel(D.train)(50));
  for (const f of [ML.fitTree(D.train, 3), ML.fitForest(D.train, 25, 3), ML.fitBoosting(D.train, 50, 0.3, 1)]) assert.ok(ML.mae(D.validation, f) < mean / 2);
  assert.ok(ML.mae(D.train, ML.fitBoosting(D.train, 50)) < ML.mae(D.train, ML.fitBoosting(D.train, 5)));
  assert.equal(ML.fitForest(D.train, 10, 3)(40), ML.fitForest(D.train, 10, 3)(40));
});

test('a forest exposes its actual fixed members and predicts their average', () => {
  const forest = ML.fitForest(ML.data().train, 25, 3);
  assert.equal(forest.trees.length, 25);
  assert.ok(Object.isFrozen(forest.trees));
  for (const x of [0, 28.6, 61.1, 76.95, 100]) {
    close(forest(x), forest.trees.reduce((sum, tree) => sum + tree(x), 0) / forest.trees.length);
  }
  const before = forest(61.1);
  assert.throws(() => { forest.trees[0] = () => -1000; }, TypeError);
  assert.throws(() => { forest.trees = []; }, TypeError);
  assert.equal(forest(61.1), before);
});
