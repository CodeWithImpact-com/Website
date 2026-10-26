/* Original calculations and fictional data for Code with Impact's lesson extensions.
 * No external repository code, figures or datasets are included.
 */
(function (root, factory) {
  'use strict';
  var core = typeof module === 'object' && module.exports ? require('./ml-engine.js') : root.MLEngine;
  var learning = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = learning;
  if (root) root.MLLearning = learning;
}(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (E) {
  'use strict';

  function finite(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function bounded(value, fallback, low, high) {
    return Math.min(high, Math.max(low, finite(value, fallback)));
  }

  // A small seeded generator makes every control state repeatable. These are
  // illustrative simulations, not random samples from a real service.
  function randomSource(seed) {
    var state = finite(seed, 42) >>> 0;
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function copyRow(row) {
    return { day: row.day, weekend: row.weekend, visitors: row.visitors, meals: row.meals };
  }

  function population() {
    // Twenty fictional weeks. Weekends have a deliberately higher demand so
    // weekday-only sampling demonstrates selection bias, even at large n.
    return Array.from({ length: 140 }, function (_, index) {
      var weekend = index % 7 >= 5;
      var visitors = Math.round(29 + (index * 13 % 17) + 7 * Math.sin(index * 0.63) + (weekend ? 33 : 0));
      var meals = Math.round(13 + 1.13 * visitors + 5 * Math.sin(index * 1.71));
      return { day: 'Day ' + (index + 1), weekend: weekend, visitors: visitors, meals: meals };
    });
  }

  function inspectRows(options) {
    options = options || {};
    var rows = population().slice(0, 14);
    if (options.outlier) rows[13].meals = 260;
    if (options.missing) {
      rows[3].meals = null;
      rows[10].meals = null;
    }
    return rows;
  }

  function quantile(sorted, fraction) {
    if (!sorted.length) return null;
    var position = (sorted.length - 1) * fraction;
    var left = Math.floor(position), right = Math.ceil(position);
    return sorted[left] + (sorted[right] - sorted[left]) * (position - left);
  }

  function summary(values) {
    if (!Array.isArray(values)) throw new TypeError('Provide an array of values.');
    var sorted = values.filter(function (value) { return Number.isFinite(value); }).sort(function (a, b) { return a - b; });
    return {
      count: sorted.length,
      missing: values.length - sorted.length,
      mean: sorted.length ? sorted.reduce(function (total, value) { return total + value; }, 0) / sorted.length : null,
      median: quantile(sorted, 0.5),
      min: sorted.length ? sorted[0] : null,
      max: sorted.length ? sorted[sorted.length - 1] : null,
      q1: quantile(sorted, 0.25),
      q3: quantile(sorted, 0.75)
    };
  }

  function sampleDays(options) {
    options = options || {};
    var size = Math.floor(bounded(options.size, 20, 1, 10000));
    var pool = population().filter(function (row) { return !options.weekdaysOnly || !row.weekend; });
    var random = randomSource(options.seed);
    return Array.from({ length: size }, function () { return copyRow(pool[Math.floor(random() * pool.length)]); });
  }

  function repeatMeans(options) {
    options = options || {};
    var size = Math.floor(bounded(options.size, 20, 1, 10000));
    var repeats = Math.floor(bounded(options.repeats, 200, 2, 2000));
    var seed = finite(options.seed, 42);
    var pool = population();
    // Each repeat has its own fixed seed. Changing n extends the same draws
    // within each repeat instead of silently changing the entire experiment.
    var means = Array.from({ length: repeats }, function (_, repeat) {
      var random = randomSource((seed + Math.imul(repeat + 1, 2654435761)) >>> 0);
      var total = 0;
      for (var index = 0; index < size; index += 1) total += pool[Math.floor(random() * pool.length)].meals;
      return total / size;
    });
    var sorted = means.slice().sort(function (a, b) { return a - b; });
    return {
      means: means,
      populationMean: summary(pool.map(function (row) { return row.meals; })).mean,
      lower: quantile(sorted, 0.05),
      upper: quantile(sorted, 0.95),
      size: size,
      repeats: repeats
    };
  }

  function prevalence(options) {
    options = options || {};
    var rate = bounded(options.rate, 10, 0, 100) / 100;
    var recall = bounded(options.recall, 80, 0, 100) / 100;
    var falsePositiveRate = bounded(options.falsePositiveRate, 10, 0, 100) / 100;
    var total = Math.floor(bounded(options.total, 1000, 1, 1000000));
    var positive = total * rate, negative = total - positive;
    var tp = positive * recall, fn = positive - tp;
    var fp = negative * falsePositiveRate, tn = negative - fp;
    var flagged = tp + fp;
    return {
      tp: tp, fn: fn, fp: fp, tn: tn, positive: positive, flagged: flagged, total: total,
      precision: flagged ? tp / flagged : 0,
      accuracy: (tp + tn) / total,
      baselineAccuracy: Math.max(positive, negative) / total,
      recall: positive ? recall : 0,
      falsePositiveRate: negative ? falsePositiveRate : 0
    };
  }

  function developmentData() {
    var splits = E.data(42);
    // The final-test property is deliberately never accessed here. Shared-fold
    // comparison uses only these 36 development records.
    return splits.train.concat(splits.validation).map(function (point) { return point.slice(); });
  }

  function crossValidate(options) {
    options = options || {};
    var development = developmentData();
    var folds = Math.floor(bounded(options.folds, 4, 2, 12));
    var k = Math.floor(bounded(options.k, 3, 1, development.length));
    var indices = development.map(function (_, index) { return index; });
    var random = randomSource(14891);
    for (var last = indices.length - 1; last > 0; last -= 1) {
      var chosen = Math.floor(random() * (last + 1));
      var swap = indices[last]; indices[last] = indices[chosen]; indices[chosen] = swap;
    }
    var foldIndices = Array.from({ length: folds }, function () { return []; });
    indices.forEach(function (index, position) { foldIndices[position % folds].push(index); });
    var rows = foldIndices.map(function (validationIndices, foldIndex) {
      var trainIndices = indices.filter(function (index) { return validationIndices.indexOf(index) === -1; });
      var train = trainIndices.map(function (index) { return development[index]; });
      var validation = validationIndices.map(function (index) { return development[index]; });
      var mean = E.mae(validation, E.meanModel(train));
      var linear = E.mae(validation, E.fitLinear(train));
      var knn = E.mae(validation, E.fitKNN(train, k));
      return {
        fold: foldIndex + 1, mean: mean, linear: linear, knn: knn,
        linearVsKnn: linear - knn,
        trainIndices: trainIndices.slice(), validationIndices: validationIndices.slice()
      };
    });
    var averages = {};
    ['mean', 'linear', 'knn', 'linearVsKnn'].forEach(function (model) {
      averages[model] = rows.reduce(function (sum, row) { return sum + row[model]; }, 0) / rows.length;
    });
    return { rows: rows, averages: averages, development: development, foldIndices: foldIndices, folds: folds, k: k };
  }

  // QR with a second orthogonalisation pass avoids forming X'X, which squares
  // its condition number. Ridge rows below make the system full rank, even
  // when there are fewer distinct observations than polynomial terms.
  function solveQR(matrix, values, columns) {
    var rows = matrix.length;
    var orthogonal = [], upper = Array.from({ length: columns }, function () { return new Array(columns).fill(0); });
    for (var column = 0; column < columns; column += 1) {
      var vector = matrix.map(function (row) { return row[column]; });
      for (var pass = 0; pass < 2; pass += 1) {
        for (var previous = 0; previous < column; previous += 1) {
          var projection = vector.reduce(function (sum, value, row) { return sum + value * orthogonal[previous][row]; }, 0);
          upper[previous][column] += projection;
          for (var row = 0; row < rows; row += 1) vector[row] -= projection * orthogonal[previous][row];
        }
      }
      var norm = vector.reduce(function (length, value) { return Math.hypot(length, value); }, 0);
      upper[column][column] = norm;
      orthogonal.push(vector.map(function (value) { return norm > 1e-15 ? value / norm : 0; }));
    }
    var projected = orthogonal.map(function (vector) {
      return vector.reduce(function (sum, value, row) { return sum + value * values[row]; }, 0);
    });
    var coefficients = new Array(columns).fill(0);
    for (var term = columns - 1; term >= 0; term -= 1) {
      var remainder = projected[term];
      for (var next = term + 1; next < columns; next += 1) remainder -= upper[term][next] * coefficients[next];
      coefficients[term] = upper[term][term] > 1e-15 ? remainder / upper[term][term] : 0;
    }
    return coefficients;
  }

  function regularisedFit(points, degree, lambda) {
    if (!Array.isArray(points) || !points.length) throw new RangeError('Provide at least one training point.');
    points.forEach(function (point) {
      if (!Array.isArray(point) || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        throw new TypeError('Training points must contain finite visitor and meal values.');
      }
    });
    degree = Math.floor(bounded(degree, 5, 1, 9));
    lambda = bounded(lambda, 0, 0, 1000000);
    var centre = points.reduce(function (sum, point) { return sum + point[0]; }, 0) / points.length;
    var scale = points.reduce(function (maximum, point) { return Math.max(maximum, Math.abs(point[0] - centre)); }, 0) || 1;
    var columns = degree + 1;
    var matrix = points.map(function (point) {
      var z = (point[0] - centre) / scale, powers = [1];
      for (var term = 1; term < columns; term += 1) powers.push(powers[term - 1] * z);
      return powers;
    });
    var values = points.map(function (point) { return point[1]; });
    // Mean squared training error + lambda * sum(non-intercept coefficients²).
    // A tiny numerical floor stabilises lambda=0; it has no visible effect on
    // ordinary fits and does not penalise the intercept.
    var penalty = Math.sqrt(points.length * lambda + 1e-12);
    for (var regularized = 1; regularized < columns; regularized += 1) {
      var row = new Array(columns).fill(0); row[regularized] = penalty;
      matrix.push(row); values.push(0);
    }
    var coefficients = solveQR(matrix, values, columns);
    var predict = function (x) {
      var z = (x - centre) / scale, result = coefficients[degree];
      for (var term = degree - 1; term >= 0; term -= 1) result = result * z + coefficients[term];
      return result;
    };
    predict.coefficients = Object.freeze(coefficients.slice());
    predict.centre = centre; predict.scale = scale; predict.degree = degree; predict.lambda = lambda;
    return predict;
  }

  function nestedTraining(points) {
    var remaining = points.slice().sort(function (a, b) { return a[0] - b[0]; });
    var selected = [remaining.shift()];
    // Farthest-first selection keeps every small sample spread across visitor
    // values. Increasing size retains every previously selected day.
    while (remaining.length) {
      var best = 0, greatestDistance = -1;
      remaining.forEach(function (point, index) {
        var distance = selected.reduce(function (closest, chosen) { return Math.min(closest, Math.abs(point[0] - chosen[0])); }, Infinity);
        if (distance > greatestDistance) { greatestDistance = distance; best = index; }
      });
      selected.push(remaining.splice(best, 1)[0]);
    }
    return selected;
  }

  function learningCurve(options) {
    options = options || {};
    var splits = E.data(42);
    var size = Math.floor(bounded(options.size, 12, 3, splits.train.length));
    var train = nestedTraining(splits.train).slice(0, size).map(function (point) { return point.slice(); });
    var validation = splits.validation.map(function (point) { return point.slice(); });
    var predict = regularisedFit(train, options.degree, options.lambda);
    return {
      train: train, validation: validation, predict: predict,
      trainMAE: E.mae(train, predict), validationMAE: E.mae(validation, predict),
      degree: predict.degree, lambda: predict.lambda, size: size
    };
  }

  return Object.freeze({
    population: population, inspectRows: inspectRows, summary: summary,
    sampleDays: sampleDays, repeatMeans: repeatMeans, prevalence: prevalence,
    crossValidate: crossValidate, regularisedFit: regularisedFit, learningCurve: learningCurve
  });
}));
