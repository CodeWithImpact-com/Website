/* Original, dependency-free calculations for the Code with Impact Learn ML labs.
 * Fictional data illustrates model behaviour; it is not operational planning advice.
 */
(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.MLEngine = engine;
}(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  function checkPoints(points) {
    if (!Array.isArray(points) || !points.length) throw new RangeError('Provide at least one data point.');
    points.forEach(function (point) {
      if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        throw new TypeError('Every data point must contain two finite numbers.');
      }
    });
    return points;
  }

  function randomSource(seed) {
    var state = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 42;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundOne(value) { return Math.round(value * 10) / 10; }

  function data(seed) {
    var random = randomSource(seed === undefined ? 42 : seed);
    var splits = { train: [], validation: [], test: [] };
    // Interleaved samples keep each split spread across the same visitor range.
    // Every generated day occurs in exactly one split, with independent noise.
    for (var index = 0; index < 48; index += 1) {
      var visitors = roundOne(2 + index * 2 + (random() - 0.5) * 1.4);
      var demand = 15 + 1.05 * visitors + 0.0039 * visitors * visitors + 4 * Math.sin(visitors / 12);
      var meals = roundOne(Math.max(0, Math.min(170, demand + (random() - 0.5) * 18)));
      var split = index % 4 === 1 ? 'validation' : index % 4 === 2 ? 'test' : 'train';
      splits[split].push([visitors, meals]);
    }
    return splits;
  }

  function meanModel(points) {
    checkPoints(points);
    var mean = points.reduce(function (sum, point) { return sum + point[1]; }, 0) / points.length;
    return function () { return mean; };
  }

  function fitLinear(points) {
    checkPoints(points);
    var count = points.length;
    var meanX = points.reduce(function (sum, point) { return sum + point[0]; }, 0) / count;
    var meanY = points.reduce(function (sum, point) { return sum + point[1]; }, 0) / count;
    var numerator = 0;
    var denominator = 0;
    points.forEach(function (point) {
      var offset = point[0] - meanX;
      numerator += offset * (point[1] - meanY);
      denominator += offset * offset;
    });
    var slope = denominator > 0 ? numerator / denominator : 0;
    return function (x) { return meanY + slope * (x - meanX); };
  }

  // Householder QR solves the augmented least-squares system directly. Avoiding
  // normal equations and scaling x to [-1, 1] keeps degree-nine fits well behaved.
  function leastSquares(matrix, values, columns) {
    var rows = matrix.length;
    for (var column = 0; column < columns; column += 1) {
      var norm = 0;
      for (var row = column; row < rows; row += 1) norm = Math.hypot(norm, matrix[row][column]);
      if (norm < 1e-15) continue;
      var alpha = matrix[column][column] >= 0 ? -norm : norm;
      var vector = [];
      for (var vectorRow = column; vectorRow < rows; vectorRow += 1) vector.push(matrix[vectorRow][column]);
      vector[0] -= alpha;
      var squaredNorm = vector.reduce(function (sum, entry) { return sum + entry * entry; }, 0);
      var multiplier = 2 / squaredNorm;
      for (var target = column; target < columns; target += 1) {
        var projection = 0;
        for (var dotRow = column; dotRow < rows; dotRow += 1) projection += vector[dotRow - column] * matrix[dotRow][target];
        projection *= multiplier;
        for (var updateRow = column; updateRow < rows; updateRow += 1) matrix[updateRow][target] -= projection * vector[updateRow - column];
      }
      var valueProjection = 0;
      for (var valueRow = column; valueRow < rows; valueRow += 1) valueProjection += vector[valueRow - column] * values[valueRow];
      valueProjection *= multiplier;
      for (var updateValue = column; updateValue < rows; updateValue += 1) values[updateValue] -= valueProjection * vector[updateValue - column];
    }
    var coefficients = new Array(columns).fill(0);
    for (var backRow = columns - 1; backRow >= 0; backRow -= 1) {
      var remainder = values[backRow];
      for (var backColumn = backRow + 1; backColumn < columns; backColumn += 1) remainder -= matrix[backRow][backColumn] * coefficients[backColumn];
      coefficients[backRow] = Math.abs(matrix[backRow][backRow]) > 1e-15 ? remainder / matrix[backRow][backRow] : 0;
    }
    return coefficients;
  }

  function fitPolynomial(points, degree) {
    checkPoints(points);
    degree = Math.min(9, Math.max(1, Math.floor(Number(degree) || 1)));
    var centre = points.reduce(function (sum, point) { return sum + point[0]; }, 0) / points.length;
    var scale = points.reduce(function (largest, point) { return Math.max(largest, Math.abs(point[0] - centre)); }, 0);
    if (scale === 0) return meanModel(points);
    var columns = degree + 1;
    var values = points.map(function (point) { return point[1]; });
    var matrix = points.map(function (point) {
      var normalized = (point[0] - centre) / scale;
      var powers = [1];
      for (var power = 1; power < columns; power += 1) powers.push(powers[power - 1] * normalized);
      return powers;
    });
    // A tiny ridge on nonconstant terms handles repeated/sparse x values. The
    // intercept stays unpenalized, so a constant target is represented exactly.
    for (var regularized = 1; regularized < columns; regularized += 1) {
      var regularizationRow = new Array(columns).fill(0);
      regularizationRow[regularized] = 0.00001;
      matrix.push(regularizationRow);
      values.push(0);
    }
    var coefficients = leastSquares(matrix, values, columns);
    return function (x) {
      var normalized = (x - centre) / scale;
      var prediction = coefficients[degree];
      for (var power = degree - 1; power >= 0; power -= 1) prediction = prediction * normalized + coefficients[power];
      return prediction;
    };
  }

  function fitKNN(points, k) {
    checkPoints(points);
    k = Math.min(points.length, Math.max(1, Math.floor(Number(k) || 1)));
    // Snapshot the training data so later UI edits do not silently change a fit.
    var samples = points.map(function (point, index) { return { x: point[0], y: point[1], index: index }; });
    return function (x) {
      var neighbours = samples.slice().sort(function (a, b) {
        return Math.abs(a.x - x) - Math.abs(b.x - x) || a.index - b.index;
      }).slice(0, k);
      return neighbours.reduce(function (sum, sample) { return sum + sample.y; }, 0) / k;
    };
  }

  function mae(points, predict) {
    checkPoints(points);
    if (typeof predict !== 'function') throw new TypeError('Provide a prediction function.');
    return points.reduce(function (sum, point) { return sum + Math.abs(point[1] - predict(point[0])); }, 0) / points.length;
  }

  function classificationCases() {
    // Original fictional validation days. A probability is a model output; these
    // fixed scores are not a trained or calibrated classifier.
    return [
      { p: 0.07, y: 0 }, { p: 0.13, y: 0 }, { p: 0.19, y: 1 }, { p: 0.24, y: 0 },
      { p: 0.29, y: 0 }, { p: 0.34, y: 1 }, { p: 0.39, y: 0 }, { p: 0.45, y: 1 },
      { p: 0.48, y: 0 }, { p: 0.55, y: 1 }, { p: 0.59, y: 0 }, { p: 0.64, y: 1 },
      { p: 0.71, y: 1 }, { p: 0.78, y: 1 }, { p: 0.86, y: 1 }, { p: 0.94, y: 1 }
    ];
  }

  // Real scores for the classification lab: a logistic regression fitted on the
  // training busy days, applied to the validation days. Rounded to two decimals for display.
  function logisticCases() {
    var d = busyDays(), model = fitLogistic(d.train);
    return d.validation.map(function (p) { return { p: Math.round(model(p[0]) * 100) / 100, y: p[1], x: p[0] }; })
      .sort(function (a, b) { return a.p - b.p; });
  }

  function confusion(cases, threshold) {
    if (!Array.isArray(cases)) throw new TypeError('Provide an array of classification cases.');
    if (!Number.isFinite(threshold)) throw new TypeError('The threshold must be a finite number.');
    var result = { tp: 0, fp: 0, tn: 0, fn: 0, precision: 0, recall: 0, accuracy: 0, flagged: 0 };
    cases.forEach(function (item) {
      if (!item || !Number.isFinite(item.p) || item.p < 0 || item.p > 1 || (item.y !== 0 && item.y !== 1)) {
        throw new TypeError('Each classification case needs a probability from 0 to 1 and a binary outcome.');
      }
      if (item.p >= threshold) result[item.y ? 'tp' : 'fp'] += 1;
      else result[item.y ? 'fn' : 'tn'] += 1;
    });
    result.flagged = result.tp + result.fp;
    // Zero is an explicit UI convention when the denominator is empty.
    result.precision = result.flagged ? result.tp / result.flagged : 0;
    result.recall = result.tp + result.fn ? result.tp / (result.tp + result.fn) : 0;
    result.accuracy = cases.length ? (result.tp + result.tn) / cases.length : 0;
    return result;
  }

  function locations() {
    return [
      [11, 16], [16, 22], [23, 12], [28, 25], [20, 33], [34, 18], [9, 29], [29, 37],
      [64, 17], [72, 11], [81, 19], [88, 31], [73, 35], [60, 28], [83, 42], [93, 20],
      [27, 71], [36, 64], [43, 77], [34, 88], [50, 90], [58, 76], [21, 85], [48, 63],
      [61, 55], [14, 51], [77, 72], [89, 83]
    ];
  }

  function squaredDistance(a, b) {
    return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
  }

  function nearestCentre(point, centres) {
    var best = 0;
    for (var index = 1; index < centres.length; index += 1) {
      if (squaredDistance(point, centres[index]) < squaredDistance(point, centres[best])) best = index;
    }
    return best;
  }

  function kmeans(points, k, iterations) {
    checkPoints(points);
    k = Math.min(points.length, Math.max(1, Math.floor(Number(k) || 1)));
    iterations = iterations === undefined ? 30 : Math.min(1000, Math.max(1, Math.floor(Number(iterations) || 1)));
    var centres = [points[0].slice(0, 2)];
    var picked = [0];
    // Deterministic farthest-first initialization. Different initialization
    // strategies can produce different local optima; this is one illustration.
    while (centres.length < k) {
      var farthest = -1;
      var greatestDistance = -1;
      points.forEach(function (point, index) {
        if (picked.indexOf(index) !== -1) return;
        var distance = squaredDistance(point, centres[nearestCentre(point, centres)]);
        if (distance > greatestDistance) { greatestDistance = distance; farthest = index; }
      });
      picked.push(farthest);
      centres.push(points[farthest].slice(0, 2));
    }
    var assignments;
    for (var iteration = 0; iteration < iterations; iteration += 1) {
      assignments = points.map(function (point) { return nearestCentre(point, centres); });
      var totals = centres.map(function () { return [0, 0, 0]; });
      points.forEach(function (point, index) {
        var total = totals[assignments[index]];
        total[0] += point[0]; total[1] += point[1]; total[2] += 1;
      });
      var next = centres.map(function (centre, index) {
        var total = totals[index];
        return total[2] ? [total[0] / total[2], total[1] / total[2]] : centre.slice();
      });
      var movement = next.reduce(function (sum, centre, index) { return sum + squaredDistance(centre, centres[index]); }, 0);
      centres = next;
      if (movement < 1e-12) break;
    }
    // Ensure reported assignments and inertia refer to the returned centres,
    // including when the iteration budget ends before convergence.
    assignments = points.map(function (point) { return nearestCentre(point, centres); });
    var inertia = points.reduce(function (sum, point, index) { return sum + squaredDistance(point, centres[assignments[index]]); }, 0);
    return { centres: centres, assignments: assignments, inertia: inertia };
  }


  // ---- Version 9: methods used by the "How it works" panels and the Methods guide ----

  // Synthetic busy-day data for logistic regression. Busy days become more likely as
  // expected visitors rise, but other (hidden) factors mean the classes overlap.
  function busyDays(seed) {
    var random = randomSource(seed === undefined ? 15 : seed);
    var train = [], validation = [];
    for (var index = 0; index < 40; index += 1) {
      var visitors = roundOne(8 + index * 2.1 + (random() - 0.5) * 3);
      var chance = 1 / (1 + Math.exp(-(visitors - 52) / 9));
      var busy = random() < chance ? 1 : 0;
      (index % 5 === 1 || index % 5 === 3 ? validation : train).push([visitors, busy]);
    }
    return { train: train, validation: validation };
  }

  // Logistic regression on one feature, fitted by Newton's method (iteratively
  // reweighted least squares) on a standardised input, with a tiny ridge for stability.
  function fitLogistic(points) {
    checkPoints(points);
    var n = points.length;
    var mean = points.reduce(function (s, p) { return s + p[0]; }, 0) / n;
    var sd = Math.sqrt(points.reduce(function (s, p) { return s + (p[0] - mean) * (p[0] - mean); }, 0) / n) || 1;
    var b0 = 0, b1 = 0;
    for (var iteration = 0; iteration < 50; iteration += 1) {
      var g0 = 0, g1 = 0, h00 = 1e-6, h01 = 0, h11 = 1e-3;
      points.forEach(function (p) {
        var z = (p[0] - mean) / sd, q = 1 / (1 + Math.exp(-(b0 + b1 * z))), w = q * (1 - q);
        g0 += p[1] - q; g1 += (p[1] - q) * z; h00 += w; h01 += w * z; h11 += w * z * z;
      });
      g1 -= 1e-3 * b1;
      var det = h00 * h11 - h01 * h01;
      var d0 = (h11 * g0 - h01 * g1) / det, d1 = (h00 * g1 - h01 * g0) / det;
      b0 += d0; b1 += d1;
      if (Math.abs(d0) + Math.abs(d1) < 1e-10) break;
    }
    var slope = b1 / sd, intercept = b0 - b1 * mean / sd;
    var predict = function (x) { return 1 / (1 + Math.exp(-(intercept + slope * x))); };
    predict.intercept = intercept; predict.slope = slope;
    predict.midpoint = slope !== 0 ? -intercept / slope : NaN;
    return predict;
  }

  // A regression tree on one feature: each split chooses the cut that most reduces
  // squared error; leaves predict the mean of their training days.
  function fitTree(points, depth, minLeaf) {
    checkPoints(points);
    depth = Math.max(0, Math.floor(Number(depth) || 0));
    minLeaf = Math.max(1, Math.floor(Number(minLeaf) || 2));
    function build(rows, level) {
      var mean = rows.reduce(function (s, p) { return s + p[1]; }, 0) / rows.length;
      if (level >= depth || rows.length < 2 * minLeaf) return { value: mean };
      var sorted = rows.slice().sort(function (a, b) { return a[0] - b[0]; });
      var best = null;
      for (var i = minLeaf; i <= sorted.length - minLeaf; i += 1) {
        if (i < sorted.length && sorted[i - 1][0] === sorted[i][0]) continue;
        var left = sorted.slice(0, i), right = sorted.slice(i);
        var sse = [left, right].reduce(function (total, part) {
          var m = part.reduce(function (s, p) { return s + p[1]; }, 0) / part.length;
          return total + part.reduce(function (s, p) { return s + (p[1] - m) * (p[1] - m); }, 0);
        }, 0);
        if (!best || sse < best.sse) best = { sse: sse, cut: (sorted[i - 1][0] + sorted[i][0]) / 2, left: left, right: right };
      }
      if (!best) return { value: mean };
      return { cut: best.cut, left: build(best.left, level + 1), right: build(best.right, level + 1) };
    }
    var tree = build(points, 0);
    var predict = function (x) { var node = tree; while (node.cut !== undefined) node = x < node.cut ? node.left : node.right; return node.value; };
    predict.tree = tree;
    return predict;
  }

  // A random forest (bagging): many trees, each fitted to a bootstrap sample of the
  // training days, averaged together. Seeded so the result is the same every time.
  function fitForest(points, trees, depth, seed) {
    checkPoints(points);
    trees = Math.max(1, Math.floor(Number(trees) || 25));
    var random = randomSource(seed === undefined ? 11 : seed), models = [];
    for (var t = 0; t < trees; t += 1) {
      var sample = points.map(function () { return points[Math.floor(random() * points.length)]; });
      models.push(fitTree(sample, depth === undefined ? 3 : depth, 2));
    }
    var predict = function (x) { return models.reduce(function (s, m) { return s + m(x); }, 0) / models.length; };
    // The guide draws actual members of this ensemble. Keep the membership fixed
    // so inspecting the trees cannot replace a member and silently change a fit.
    Object.defineProperty(predict, 'trees', { value: Object.freeze(models.slice()), enumerable: true });
    return predict;
  }

  // Gradient boosting with small trees: start from the mean, then repeatedly fit a
  // shallow tree to the remaining errors and add a fraction of it.
  function fitBoosting(points, rounds, rate, depth) {
    checkPoints(points);
    rounds = Math.max(0, Math.floor(Number(rounds) || 0));
    rate = rate === undefined ? 0.3 : rate;
    var base = meanModel(points)(), stages = [];
    var current = function (x) { return base + stages.reduce(function (s, m) { return s + rate * m(x); }, 0); };
    for (var r = 0; r < rounds; r += 1) {
      var residuals = points.map(function (p) { return [p[0], p[1] - current(p[0])]; });
      stages.push(fitTree(residuals, depth === undefined ? 1 : depth, 2));
    }
    return current;
  }

  function csv(points) {
    checkPoints(points);
    return 'expected_visitors,meals_needed\n' + points.map(function (point) { return point[0] + ',' + point[1]; }).join('\n') + '\n';
  }

  return Object.freeze({
    data: data, fitLinear: fitLinear, fitPolynomial: fitPolynomial, fitKNN: fitKNN,
    meanModel: meanModel, mae: mae, classificationCases: classificationCases,
    confusion: confusion, locations: locations, kmeans: kmeans, csv: csv,
    busyDays: busyDays, fitLogistic: fitLogistic, logisticCases: logisticCases,
    fitTree: fitTree, fitForest: fitForest, fitBoosting: fitBoosting
  });
}));
