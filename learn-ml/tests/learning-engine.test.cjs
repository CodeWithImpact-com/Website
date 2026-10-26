'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../ml-engine.js');
const L = require('../learning-engine.js');

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should equal ${expected} within ${tolerance}`);
}

function variance(values) {
  const mean = L.summary(values).mean;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

test('summaries count missing data, interpolate quartiles and leave inputs unchanged', () => {
  const input = [8, null, 2, NaN, 4, undefined, Infinity, 6, '10'];
  const snapshot = input.slice();
  assert.deepEqual(L.summary(input), { count: 4, missing: 5, mean: 5, median: 5, min: 2, max: 8, q1: 3.5, q3: 6.5 });
  assert.deepEqual(input, snapshot);
  assert.deepEqual(L.summary([]), { count: 0, missing: 0, mean: null, median: null, min: null, max: null, q1: null, q3: null });
  assert.equal(L.summary([null]).mean, null, 'missing values must not become zero');
  assert.equal(L.summary([7]).q3, 7);
  assert.throws(() => L.summary(null), TypeError);
});

test('the original 140-day population is repeatable, fresh and has systematically busier weekends', () => {
  const rows = L.population();
  assert.deepEqual(rows, L.population());
  assert.equal(rows.length, 140);
  assert.equal(new Set(rows.map(row => row.day)).size, 140);
  assert.equal(rows.filter(row => row.weekend).length, 40);
  rows.forEach(row => {
    assert.equal(typeof row.day, 'string');
    assert.equal(typeof row.weekend, 'boolean');
    assert.ok(Number.isInteger(row.meals) && row.meals > 0);
    assert.ok(Number.isInteger(row.visitors) && row.visitors > 0);
  });
  const weekend = L.summary(rows.filter(row => row.weekend).map(row => row.meals)).mean;
  const weekday = L.summary(rows.filter(row => !row.weekend).map(row => row.meals)).mean;
  assert.ok(weekend > weekday + 30);
  rows[0].meals = -1;
  assert.ok(L.population()[0].meals > 0);
});

test('the inspection controls separately expose outlier sensitivity and missing meal values', () => {
  const regular = L.summary(L.inspectRows().map(row => row.meals));
  const unusual = L.summary(L.inspectRows({ outlier: true }).map(row => row.meals));
  const both = L.summary(L.inspectRows({ outlier: true, missing: true }).map(row => row.meals));
  assert.ok(unusual.mean > regular.mean + 10);
  assert.equal(unusual.median, regular.median);
  assert.equal(unusual.max, 260);
  assert.equal(both.missing, 2);
  assert.equal(both.count, 12);
  assert.equal(both.max, 260);
  assert.equal(L.inspectRows().filter(row => row.meals === null).length, 0);
});

test('sampling is seeded and with replacement, and weekday-only requests exclude weekends', () => {
  const sample = L.sampleDays({ size: 200, seed: 91 });
  assert.deepEqual(sample, L.sampleDays({ size: 200, seed: 91 }));
  assert.notDeepEqual(sample, L.sampleDays({ size: 200, seed: 92 }));
  assert.ok(new Set(sample.map(row => row.day)).size < sample.length);
  assert.ok(L.sampleDays({ size: 200, weekdaysOnly: true }).every(row => !row.weekend));
  const duplicateIndex = sample.findIndex((row, index) => sample.findIndex(other => other.day === row.day) < index);
  const duplicate = sample[duplicateIndex];
  const previous = sample.find(row => row.day === duplicate.day);
  duplicate.meals = -5;
  assert.ok(previous.meals > 0, 'duplicate draws are separate row objects');
});

test('more weekday observations retain selection bias while representative sampling approaches the population mean', () => {
  const populationMean = L.summary(L.population().map(row => row.meals)).mean;
  const representative = L.summary(L.sampleDays({ size: 8000 }).map(row => row.meals)).mean;
  close(representative, populationMean, 1);
  for (const size of [1000, 8000]) {
    const biased = L.summary(L.sampleDays({ size, weekdaysOnly: true }).map(row => row.meals)).mean;
    assert.ok(populationMean - biased > 8, 'a large biased sample does not become representative');
  }
});

test('repeated sample means use stable repeats and narrow as representative sample size grows', () => {
  const small = L.repeatMeans({ size: 5, repeats: 200 });
  const large = L.repeatMeans({ size: 80, repeats: 200 });
  assert.deepEqual(small, L.repeatMeans({ size: 5, repeats: 200 }));
  assert.deepEqual(L.repeatMeans({ size: 5, repeats: 20 }).means, small.means.slice(0, 20));
  assert.equal(small.means.length, 200);
  close(small.populationMean, L.summary(L.population().map(row => row.meals)).mean);
  assert.ok(large.upper - large.lower < (small.upper - small.lower) / 2);
  assert.ok(variance(large.means) < variance(small.means) / 5);
  assert.ok(large.lower < large.populationMean && large.upper > large.populationMean);
  assert.ok(small.means.filter(mean => mean >= small.lower && mean <= small.upper).length >= 178);
});

test('prevalence uses expected counts and compares against the majority-class baseline', () => {
  const metrics = L.prevalence();
  assert.equal(metrics.tp, 80);
  assert.equal(metrics.fn, 20);
  assert.equal(metrics.fp, 90);
  assert.equal(metrics.tn, 810);
  assert.equal(metrics.positive, 100);
  assert.equal(metrics.flagged, 170);
  close(metrics.precision, 80 / 170);
  close(metrics.accuracy, 0.89);
  close(metrics.baselineAccuracy, 0.9);
  assert.ok(metrics.accuracy < metrics.baselineAccuracy, 'accuracy alone would favour a model that misses all positive cases');
  assert.ok(L.prevalence({ rate: 1 }).precision < L.prevalence({ rate: 50 }).precision);
  close(L.prevalence({ rate: 80 }).baselineAccuracy, 0.8, 1e-12);
});

test('prevalence endpoints stay finite and fractional expected counts preserve the total', () => {
  for (const rate of [0, 1, 17, 50, 99, 100]) {
    for (const recall of [0, 80, 100]) {
      for (const falsePositiveRate of [0, 10, 100]) {
        const metrics = L.prevalence({ rate, recall, falsePositiveRate, total: 37 });
        close(metrics.tp + metrics.fp + metrics.tn + metrics.fn, 37);
        ['precision', 'accuracy', 'baselineAccuracy'].forEach(key => assert.ok(metrics[key] >= 0 && metrics[key] <= 1));
      }
    }
  }
  assert.equal(L.prevalence({ rate: 0, falsePositiveRate: 0 }).precision, 0);
  assert.equal(L.prevalence({ rate: 0 }).recall, 0);
  assert.equal(L.prevalence({ rate: 100, recall: 100 }).accuracy, 1);
});

test('cross-validation shares fixed folds across models and gives every development record one validation turn', () => {
  const result = L.crossValidate({ k: 3, folds: 4 });
  const changedK = L.crossValidate({ k: 9, folds: 4 });
  assert.deepEqual(result.foldIndices, changedK.foldIndices);
  assert.deepEqual(result, L.crossValidate({ k: 3, folds: 4 }));
  assert.equal(result.development.length, 36);
  assert.deepEqual(result.development, E.data().train.concat(E.data().validation));
  const allValidationIndices = result.rows.flatMap(row => row.validationIndices).sort((a, b) => a - b);
  assert.deepEqual(allValidationIndices, Array.from({ length: 36 }, (_, index) => index));
  const finalTest = new Set(E.data().test.map(point => JSON.stringify(point)));
  assert.ok(result.development.every(point => !finalTest.has(JSON.stringify(point))));
  result.rows.forEach((row, index) => {
    assert.equal(row.fold, index + 1);
    assert.equal(row.trainIndices.length, 27);
    assert.equal(row.validationIndices.length, 9);
    assert.ok(row.trainIndices.every(index => !row.validationIndices.includes(index)));
    assert.equal(new Set(row.trainIndices.concat(row.validationIndices)).size, 36);
    const train = row.trainIndices.map(index => result.development[index]);
    const validation = row.validationIndices.map(index => result.development[index]);
    close(row.mean, E.mae(validation, E.meanModel(train)));
    close(row.linear, E.mae(validation, E.fitLinear(train)));
    close(row.knn, E.mae(validation, E.fitKNN(train, 3)));
    close(row.linearVsKnn, row.linear - row.knn);
  });
  for (const key of ['mean', 'linear', 'knn']) close(result.averages[key], result.rows.reduce((sum, row) => sum + row[key], 0) / 4);
});

test('regularised fits recover an original quadratic and never modify their training data', () => {
  const target = x => 12 + 0.7 * x + 0.002 * x * x;
  const points = Array.from({ length: 16 }, (_, index) => [index * 6, target(index * 6)]);
  const snapshot = structuredClone(points);
  const predict = L.regularisedFit(points, 2, 0);
  for (const x of [0, 13, 50, 90]) close(predict(x), target(x), 1e-6);
  assert.deepEqual(points, snapshot);
  close(predict.centre, points.reduce((sum, point) => sum + point[0], 0) / points.length);
  assert.ok(Object.isFrozen(predict.coefficients));
  points[0][1] = 999;
  close(predict(0), target(0), 1e-6);
  assert.throws(() => L.regularisedFit([], 3, 0), RangeError);
  assert.throws(() => L.regularisedFit([[NaN, 2]], 3, 0), TypeError);
});

test('regularisation shrinks normalized non-intercept coefficients and retains an unpenalised intercept', () => {
  const points = E.data().train;
  const unpenalised = L.regularisedFit(points, 9, 0);
  const restricted = L.regularisedFit(points, 9, 0.1);
  const nearlyConstant = L.regularisedFit(points, 9, 1000000);
  const norm = predict => predict.coefficients.slice(1).reduce((sum, value) => sum + value * value, 0);
  assert.ok(norm(restricted) < norm(unpenalised));
  assert.ok(norm(nearlyConstant) < norm(restricted));
  const mean = E.meanModel(points)();
  for (const x of [0, 50, 100]) close(nearlyConstant(x), mean, 0.001);
  for (const lambda of [0, 0.1, 1000000]) {
    const predict = L.regularisedFit([[0, 17], [30, 17], [100, 17]], 9, lambda);
    close(predict(53), 17, 1e-5);
  }
});

test('high-degree sparse and repeated-input fits remain finite throughout the illustrated input range', () => {
  for (const points of [[[0, 0], [100, 100]], [[4, 3], [4, 9]], E.data().train.slice(0, 5)]) {
    for (const lambda of [0, 0.001, 1]) {
      const predict = L.regularisedFit(points, 9, lambda);
      for (let x = 0; x <= 100; x += 0.5) assert.ok(Number.isFinite(predict(x)));
    }
  }
  close(L.regularisedFit([[4, 3], [4, 9]], 9, 0)(99), 6);
});

test('learning curves retain nested training subsets and the same validation days, with independently checked scores', () => {
  const small = L.learningCurve({ degree: 9, size: 12, lambda: 0 });
  const large = L.learningCurve({ degree: 9, size: 24, lambda: 0 });
  const regularised = L.learningCurve({ degree: 9, size: 12, lambda: 0.001 });
  assert.deepEqual(large.train.slice(0, 12), small.train);
  assert.deepEqual(small.validation, large.validation);
  assert.deepEqual(small.validation, E.data().validation);
  const finalTest = new Set(E.data().test.map(point => JSON.stringify(point)));
  assert.ok(large.train.concat(large.validation).every(point => !finalTest.has(JSON.stringify(point))));
  for (const result of [small, large, regularised]) {
    close(result.trainMAE, E.mae(result.train, result.predict));
    close(result.validationMAE, E.mae(result.validation, result.predict));
  }
  assert.ok(large.validationMAE < small.validationMAE);
  assert.ok(regularised.validationMAE < small.validationMAE);
  assert.ok(regularised.trainMAE > small.trainMAE, 'a worse training fit can generalise better');
});

test('browser exports work with the core global and extension calculations never read final-test data', () => {
  const context = { window: { MLEngine: {
    ...E,
    data() {
      const data = E.data();
      return { train: data.train, validation: data.validation, get test() { throw new Error('Final test must remain locked.'); } };
    }
  } } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'learning-engine.js'), 'utf8'), context);
  assert.equal(typeof context.window.MLLearning.crossValidate, 'function');
  assert.equal(context.window.MLLearning.crossValidate().development.length, 36);
  assert.equal(context.window.MLLearning.learningCurve().train.length, 12);
  close(context.window.MLLearning.prevalence().accuracy, 0.89);
});
