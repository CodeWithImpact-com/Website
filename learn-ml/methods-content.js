'use strict';
/* Learn ML: the Methods guide and the "How it works" panels in each lesson.
   Original Code With Impact explanations, checked against An Introduction to Statistical
   Learning (ISLP), the scikit-learn user guide and Google's Machine Learning Crash Course.
   Model charts are calculated in the browser from synthetic community-kitchen data.
   Naive Bayes uses a fixed word-count illustration; the neural-network diagram
   illustrates an architecture. */
(function () {
  const E = window.MLEngine;
  const ISLP = { t: 'An Introduction to Statistical Learning (free book)', url: 'https://www.statlearning.com/' };
  const SK = 'https://scikit-learn.org/stable/modules/';

  const METHODS = [
    { id: 'linear', name: 'Linear regression', task: 'Predicts a number', family: 'number', lesson: 'regression',
      idea: 'Draws the straight line that best summarises how a number changes with an input. The prediction is a starting value (the <b>intercept</b>) plus a fixed amount (the <b>slope</b>) for every extra unit of the input. With several inputs, each one gets its own slope.',
      learns: 'It uses <b>least squares</b>: of all possible lines, it picks the one that makes the total of the squared gaps between the line and the real values as small as possible. Squaring the gaps means a few big misses count for more than many small ones, and it gives a single exact answer.',
      output: 'A number, such as 82 meals. The slope tells you how much the prediction changes for one more unit of the input, with any other inputs held fixed.',
      use: ['The relationship is roughly a straight line', 'You need to explain the model to others', 'You want a strong, simple baseline before trying anything complex'],
      watch: ['It can’t follow curves unless you add them', 'Unusual values can pull the line a long way', 'Predictions far outside the data you trained on are unreliable', 'A slope shows an association, not a cause'],
      python: 'from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(X_train, y_train)\nmodel.coef_, model.intercept_   # slopes and intercept',
      read: [ISLP, { t: 'scikit-learn: linear models', url: SK + 'linear_model.html' }, { t: 'Google ML Crash Course: linear regression', url: 'https://developers.google.com/machine-learning/crash-course/linear-regression' }] },

    { id: 'logistic', name: 'Logistic regression', task: 'Predicts a category (as a probability)', family: 'category', lesson: 'classification',
      idea: 'Despite the name, it’s used for yes/no questions such as “will tomorrow be a busy day?”. Like linear regression it adds up the inputs with weights, but then it passes the total through an S-shaped curve, so the answer is always a probability between 0 and 1.',
      learns: 'It chooses the weights that make the outcomes you actually observed as likely as possible (called <b>maximum likelihood</b>). There’s no single formula for the answer, so the computer improves the weights step by step until they stop changing.',
      output: 'A probability, such as 0.72. A threshold you choose turns it into a decision: Lesson 4 is all about that choice. Each weight changes the <i>odds</i> of a “yes” by a fixed multiple.',
      use: ['The outcome is yes/no (or one of a few categories)', 'You want probabilities, not just labels', 'You want a transparent classifier or a baseline for more complex ones'],
      watch: ['It assumes the log-odds change in a straight line with each input', 'Check that a probability of 0.7 really means “right about 70% of the time” (calibration)', 'Rare outcomes need care when you choose the threshold'],
      python: 'from sklearn.linear_model import LogisticRegression\nmodel = LogisticRegression().fit(X_train, y_train)\nprobability = model.predict_proba(X_validation)[:, 1]',
      read: [ISLP, { t: 'scikit-learn: logistic regression', url: SK + 'linear_model.html#logistic-regression' }, { t: 'Google ML Crash Course: logistic regression', url: 'https://developers.google.com/machine-learning/crash-course/logistic-regression' }] },

    { id: 'polynomial', name: 'Polynomial regression', task: 'Predicts a number', family: 'number', lesson: 'overfitting',
      idea: 'Linear regression with extra, made-up inputs: the input squared, cubed and so on. These let the line bend. The <b>degree</b> is the highest power used: degree 1 is a straight line, degree 2 can make one bend, higher degrees can wiggle more.',
      learns: 'Exactly like linear regression, by least squares. It’s still called “linear” because the prediction is a weighted sum of its inputs, even though those inputs include powers.',
      output: 'A number from a curve. The individual weights are hard to interpret, so judge the model by its predictions and its validation error.',
      use: ['The relationship has a gentle, smooth curve', 'A low degree (2 or 3) is enough'],
      watch: ['High degrees chase noise and overfit (Lesson 5 shows this)', 'Curves can shoot off wildly just outside the data range', 'Choose the degree with validation data, never training error'],
      python: 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import PolynomialFeatures\nfrom sklearn.linear_model import LinearRegression\nmodel = make_pipeline(PolynomialFeatures(degree=3), LinearRegression())',
      read: [ISLP, { t: 'scikit-learn: polynomial features', url: SK + 'preprocessing.html#polynomial-features' }] },

    { id: 'knn', name: 'k-nearest neighbours', task: 'Predicts a number or a category', family: 'both', lesson: 'comparison',
      idea: 'To predict a new day, find the <b>k</b> most similar days in the training data and average their outcomes. For categories, take a vote instead. “Similar” means closest in the inputs, for example the most similar visitor numbers.',
      learns: 'It doesn’t learn anything in advance. It simply stores the training data and does all the work when asked for a prediction, which is why it’s called a “lazy” method.',
      output: 'An average (or vote) of the neighbours. You can show the neighbours themselves as an explanation: “these five days were most like tomorrow”.',
      use: ['The pattern curves in ways a line can’t capture', 'You have a modest amount of data and only a few inputs', 'Being able to show similar past cases is useful'],
      watch: ['Small k gives jumpy predictions; large k smooths too much', 'Inputs on bigger scales dominate the distance, so scale them first', 'With many inputs, “nearest” stops meaning much', 'Predictions go flat outside the range of the data'],
      python: 'from sklearn.neighbors import KNeighborsRegressor\nmodel = KNeighborsRegressor(n_neighbors=5).fit(X_train, y_train)',
      read: [ISLP, { t: 'scikit-learn: nearest neighbours', url: SK + 'neighbors.html' }] },

    { id: 'bayes', name: 'Naive Bayes', task: 'Predicts a category', family: 'category',
      idea: 'Counts how often each feature (often each word) appears in each category, then combines those clues to score a new example. It’s “naive” because it treats every clue as independent of the others, which is rarely true but often works well.',
      learns: 'By counting. For each category it estimates how common each word is, adding a small amount so unseen words don’t produce zeros.',
      output: 'A score or probability for each category. The scores can be overconfident, so treat them as a ranking rather than exact probabilities.',
      use: ['Sorting short texts such as emails or enquiries', 'Very little data or computing power', 'A fast, simple text baseline'],
      watch: ['Its probabilities are often too extreme', 'It can’t use word order or context', 'Correlated clues get counted more than once'],
      python: 'from sklearn.feature_extraction.text import CountVectorizer\nfrom sklearn.naive_bayes import MultinomialNB\nfrom sklearn.pipeline import make_pipeline\nmodel = make_pipeline(CountVectorizer(), MultinomialNB())',
      read: [{ t: 'Try it: Learn AI, Lesson 01 (inbox triage lab)', url: '../learn/ai-made-simple.html', internal: true }, { t: 'scikit-learn: naive Bayes', url: SK + 'naive_bayes.html' }] },

    { id: 'tree', name: 'Decision tree', task: 'Predicts a number or a category', family: 'both',
      idea: 'A flowchart of yes/no questions, such as “Are expected visitors below 60?”. Each answer leads to another question or to a final prediction at a <b>leaf</b>. For numbers, a leaf predicts the average of the training days that end up there.',
      learns: 'Step by step. At each point it tries every possible question and keeps the one that best separates the outcomes, then repeats on each branch until it reaches a depth limit or too few examples remain.',
      output: 'A prediction plus the exact path of questions that led to it, which makes trees easy to explain. Number predictions come out as steps rather than a smooth line.',
      use: ['You need rules people can read and check', 'Inputs interact (e.g. weekends matter only when it’s cold)', 'Data mixes numbers and categories'],
      watch: ['Deep trees memorise the training data', 'A small change in the data can produce a very different tree', 'Limit the depth or the minimum examples per leaf'],
      python: 'from sklearn.tree import DecisionTreeRegressor, export_text\nmodel = DecisionTreeRegressor(max_depth=3).fit(X_train, y_train)\nprint(export_text(model))   # the questions as text',
      read: [ISLP, { t: 'scikit-learn: decision trees', url: SK + 'tree.html' }] },

    { id: 'forest', name: 'Random forest', task: 'Predicts a number or a category', family: 'both',
      idea: 'Many decision trees, each grown on a slightly different random sample of the training data (and, at each question, a random subset of the inputs). The forest’s prediction is the average of all the trees, or their vote.',
      learns: 'Each tree learns as a normal tree does. Because every tree sees different data, they make different mistakes, and averaging cancels much of the noise. This idea is called <b>bagging</b>.',
      output: 'A smoother, usually more accurate prediction than a single tree. You lose the single readable flowchart.',
      use: ['A strong default for table-shaped data', 'You want good accuracy with little tuning'],
      watch: ['Harder to explain than one tree (feature importance helps, with care)', 'Larger and slower to run', 'Like all trees, it can’t predict beyond the range of the data'],
      python: 'from sklearn.ensemble import RandomForestRegressor\nmodel = RandomForestRegressor(n_estimators=200, random_state=0).fit(X_train, y_train)',
      read: [ISLP, { t: 'scikit-learn: ensembles (forests and boosting)', url: SK + 'ensemble.html' }] },

    { id: 'boosting', name: 'Gradient boosting', task: 'Predicts a number or a category', family: 'both',
      idea: 'Builds small trees one after another. Each new tree focuses on the mistakes that the trees before it still make, and is added with a small weight called the <b>learning rate</b>.',
      learns: 'Start with the average. Measure what’s still wrong for each training day, fit a small tree to those errors, add a fraction of it, and repeat for many rounds.',
      output: 'Often the most accurate predictions on table-shaped data, at the cost of more settings to tune and less transparency.',
      use: ['Accuracy matters most and you have time to tune', 'Large, table-shaped data sets'],
      watch: ['Too many rounds overfits: stop using validation data', 'Several settings interact (rounds, learning rate, tree depth)', 'Harder to explain than a single tree'],
      python: 'from sklearn.ensemble import HistGradientBoostingRegressor\nmodel = HistGradientBoostingRegressor(early_stopping=True).fit(X_train, y_train)',
      read: [ISLP, { t: 'scikit-learn: ensembles (forests and boosting)', url: SK + 'ensemble.html' }] },

    { id: 'kmeans', name: 'k-means clustering', task: 'Finds groups', family: 'groups',
      idea: 'Groups data with no labels into <b>k</b> clusters, each around a centre point. For example, grouping delivery addresses that sit close together.',
      learns: 'Place k centres. Assign every point to its nearest centre. Move each centre to the middle of its points. Repeat until nothing changes.',
      output: 'A cluster number for each point, plus the centres. The clusters are a result of the inputs and the k you chose, not a hidden truth.',
      use: ['Exploring data to find natural groupings', 'Grouping places, items or activities for planning'],
      watch: ['You have to choose k', 'Scale the inputs first, or the biggest one dominates', 'It assumes round, similar-sized groups', 'Be careful grouping people: clusters can reinforce stereotypes'],
      python: 'from sklearn.cluster import KMeans\nmodel = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)\nmodel.labels_, model.cluster_centers_',
      read: [ISLP, { t: 'scikit-learn: k-means', url: SK + 'clustering.html#k-means' }] },

    { id: 'neural', name: 'Neural networks', task: 'Predicts numbers, categories, text and more', family: 'both',
      idea: 'Layers of simple units. Each unit adds up its inputs with weights and applies a small bend. Stacking many layers lets the network learn very complicated patterns, such as recognising images or predicting the next word (the basis of large language models).',
      learns: 'By <b>gradient descent</b>: make a prediction, measure the error, work out how each weight contributed (backpropagation) and nudge every weight slightly to reduce the error. Repeat millions of times.',
      output: 'Whatever the final layer produces: a number, probabilities for categories, or new text. The reasons behind a prediction are hard to see.',
      use: ['Images, sound and text', 'Very large data sets'],
      watch: ['Needs a lot of data and computing power', 'Hard to explain', 'For small table-shaped data, simpler methods often do as well or better'],
      python: 'from sklearn.neural_network import MLPRegressor\nmodel = MLPRegressor(hidden_layer_sizes=(32, 16), max_iter=2000, random_state=0)\n# For serious work, use a library such as PyTorch',
      read: [{ t: 'How LLMs work: Learn AI, Lesson 02', url: '../learn/inside-an-llm.html', internal: true }, { t: '3Blue1Brown: neural networks (videos)', url: 'https://www.3blue1brown.com/lessons/neural-networks/' }, ISLP] }
  ];

  const COMPARE = [
    ['Linear regression', 'A number', 'No', 'Yes'],
    ['Logistic regression', 'A category', 'No', 'Yes'],
    ['Polynomial regression', 'A number', 'Gentle curves', 'Partly'],
    ['k-nearest neighbours', 'Number or category', 'Yes', 'Partly'],
    ['Naive Bayes', 'A category', 'n/a', 'Yes'],
    ['Decision tree', 'Number or category', 'Yes', 'Yes, if small'],
    ['Random forest', 'Number or category', 'Yes', 'Partly'],
    ['Gradient boosting', 'Number or category', 'Yes', 'Partly'],
    ['k-means clustering', 'Groups', 'n/a', 'Yes'],
    ['Neural networks', 'Almost anything', 'Yes', 'No']
  ];

  /* ---------- Small charts, calculated from the kitchen data ---------- */
  const W = 320, H = 190, L = 34, R = 10, T = 12, B = 26;
  const X = (v, max = 100) => L + v / max * (W - L - R);
  const Y = (v, max = 175) => T + (1 - v / max) * (H - T - B);
  function axes(yLabel, yMax = 175, xLabel = 'Expected visitors', ticks = [0, 50, 100, 150]) {
    return `<path d="M${L} ${T}V${H - B}H${W - R}" fill="none" stroke="#b5c0c7"/>` +
      ticks.map(t => `<text x="${L - 5}" y="${Y(t, yMax) + 3}" text-anchor="end" class="mc-axis">${t}</text>`).join('') +
      `<text x="${L}" y="${T - 2}" class="mc-axis">${yLabel}</text><text x="${W - R}" y="${H - 6}" text-anchor="end" class="mc-axis">${xLabel} →</text>`;
  }
  const dots = (pts, cls = 'mc-dot', yMax = 175) => pts.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y, yMax)}" r="3.4" class="${cls}"/>`).join('');
  const curve = (f, cls, yMax = 175) => `<polyline class="${cls}" points="${Array.from({ length: 201 }, (_, i) => { const x = i / 2, y = Math.max(-5, Math.min(yMax + 5, f(x))); return X(x) + ',' + Y(y, yMax); }).join(' ')}"/>`;
  const svg = (inner, title, clipId) => `<svg class="mc-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}"><title>${title}</title><defs><clipPath id="${clipId}"><rect x="${L}" y="${T - 4}" width="${W - L - R}" height="${H - T - B + 8}"/></clipPath></defs>${inner}</svg>`;
  const legend = items => `<p class="mc-legend">${items.map(([label, cls]) => `<span class="${cls}">${label}</span>`).join('')}</p>`;

  function chart(id) {
    const D = E.data(42), tr = D.train;
    const chartSVG = (inner, title) => svg(inner, title, 'mc-clip-' + id);
    if (id === 'linear') {
      const f = E.fitLinear(tr);
      return chartSVG(axes('Meals') + tr.map(([x, y]) => `<path d="M${X(x)} ${Y(y)}V${Y(f(x))}" class="mc-gap"/>`).join('') + `<g clip-path="url(#mc-clip-${id})">${curve(f, 'mc-line')}</g>` + dots(tr), 'Training days with the least-squares line and the gaps it minimises') +
        legend([['Training days', 'k-dot'], ['Fitted line', 'k-line'], ['Gaps (residuals)', 'k-gap']]) + mae(f);
    }
    if (id === 'logistic') {
      const b = E.busyDays(), f = E.fitLogistic(b.train), m = f.midpoint;
      const pts = b.train.map(([x, y], i) => `<circle cx="${X(x)}" cy="${Y(y ? 0.96 - (i % 3) * 0.03 : 0.04 + (i % 3) * 0.03, 1)}" r="3.4" class="${y ? 'mc-dot' : 'mc-hollow'}"/>`).join('');
      return chartSVG(axes('Chance of a busy day', 1, 'Expected visitors', [0, 0.5, 1]) + `<path d="M${L} ${Y(0.5, 1)}H${W - R}" class="mc-gap" stroke-dasharray="3 3"/><path d="M${X(m)} ${T}V${H - B}" class="mc-gap" stroke-dasharray="3 3"/>` + curve(f, 'mc-line', 1) + pts, 'Busy and quiet training days with the fitted S-shaped logistic curve') +
        legend([['Busy days (top)', 'k-dot'], ['Quiet days (bottom)', 'k-hollow'], ['Fitted probability', 'k-line']]) +
        `<p class="mc-note">Fitted on 24 synthetic days: the chance of a busy day passes 50% at about <b>${Math.round(m)} expected visitors</b>, and each extra visitor multiplies the odds of a busy day by about <b>${Math.exp(f.slope).toFixed(2)}</b>.</p>`;
    }
    if (id === 'polynomial') {
      const f1 = E.fitPolynomial(tr, 1), f3 = E.fitPolynomial(tr, 3), f9 = E.fitPolynomial(tr, 9);
      return chartSVG(axes('Meals') + `<g clip-path="url(#mc-clip-${id})">${curve(f1, 'mc-line')}${curve(f3, 'mc-line2')}${curve(f9, 'mc-line3')}</g>` + dots(tr), 'Polynomial fits of degree 1, 3 and 9 to the training days') +
        legend([['Degree 1', 'k-line'], ['Degree 3', 'k-line2'], ['Degree 9', 'k-line3']]) +
        `<p class="mc-note">Validation error: degree 1 <b>${E.mae(D.validation, f1).toFixed(1)}</b>, degree 3 <b>${E.mae(D.validation, f3).toFixed(1)}</b>, degree 9 <b>${E.mae(D.validation, f9).toFixed(1)}</b> meals.</p>`;
    }
    if (id === 'knn') {
      const k = 5, q = 61, f = E.fitKNN(tr, k);
      const near = tr.map((p, i) => ({ p, i, d: Math.abs(p[0] - q) })).sort((a, b) => a.d - b.d || a.i - b.i).slice(0, k).map(n => n.p);
      return chartSVG(axes('Meals') + `<path d="M${X(q)} ${T}V${H - B}" class="mc-gap" stroke-dasharray="3 3"/><g clip-path="url(#mc-clip-${id})">${curve(f, 'mc-line2')}</g>` + dots(tr, 'mc-faint') + dots(near) + `<circle cx="${X(q)}" cy="${Y(f(q))}" r="6" class="mc-star"/>`, 'Five nearest training days to a new day with 61 expected visitors, and their average') +
        legend([['5 nearest days', 'k-dot'], ['Prediction = their average', 'k-star'], ['All predictions (k = 5)', 'k-line2']]) +
        `<p class="mc-note">For a day with ${q} expected visitors, the five most similar days average <b>${Math.round(f(q))} meals</b>.</p>` + mae(f);
    }
    if (id === 'bayes') {
      const words = [['fell', 5, 0], ['urgent', 4, 1], ['flooded', 3, 0], ['thanks', 0, 4], ['newsletter', 0, 5]];
      const bw = 26;
      return chartSVG(`<text x="${L}" y="${T}" class="mc-axis">How often each word appears (fictional messages)</text>` + words.map(([w, u, c], i) => {
        const x = 40 + i * 56;
        return `<rect x="${x}" y="${150 - u * 22}" width="${bw / 2}" height="${u * 22}" class="mc-bar1"/><rect x="${x + bw / 2 + 2}" y="${150 - c * 22}" width="${bw / 2}" height="${c * 22}" class="mc-bar2"/><text x="${x + bw / 2}" y="168" text-anchor="middle" class="mc-axis">${w}</text>`;
      }).join('') + `<path d="M30 150H${W - R}" stroke="#b5c0c7"/>`, 'Illustration of fixed word counts in fictional urgent and non-urgent messages') +
        legend([['Urgent messages', 'k-bar1'], ['Can-wait messages', 'k-bar2']]) +
        `<p class="mc-note"><b>Word-count illustration.</b> These fixed fictional counts show clues a classifier could use: “flooded” points towards urgent; “thanks” towards can wait.</p>`;
    }
    if (id === 'tree') {
      const f = E.fitTree(tr, 2, 2), rules = [];
      (function walk(node, path) { if (node.cut === undefined) { rules.push(`${path.join(' and ') || 'All days'} → <b>${Math.round(node.value)} meals</b>`); return; } walk(node.left, path.concat(`visitors &lt; ${node.cut.toFixed(2)}`)); walk(node.right, path.concat(`visitors ≥ ${node.cut.toFixed(2)}`)); })(f.tree, []);
      const cuts = []; (function c(n) { if (n.cut !== undefined) { cuts.push(n.cut); c(n.left); c(n.right); } })(f.tree);
      return chartSVG(axes('Meals') + cuts.map(c => `<path d="M${X(c)} ${T}V${H - B}" class="mc-gap" stroke-dasharray="3 3"/>`).join('') + `<g clip-path="url(#mc-clip-${id})">${curve(f, 'mc-line')}</g>` + dots(tr), 'A depth-2 decision tree splits the visitor range into four steps') +
        legend([['Tree prediction (depth 2)', 'k-line'], ['Split points', 'k-gap']]) +
        `<p class="mc-note">Split points are shown to two decimal places; leaf predictions are rounded to the nearest meal.</p><ul class="mc-rules">${rules.map(r => `<li>${r}</li>`).join('')}</ul>` + mae(f);
    }
    if (id === 'forest') {
      const f = E.fitForest(tr, 25, 3);
      return chartSVG(axes('Meals') + `<g clip-path="url(#mc-clip-${id})">${f.trees.slice(0, 3).map(t => curve(t, 'mc-thin')).join('')}${curve(f, 'mc-line')}</g>` + dots(tr), 'Three individual trees and the average of a 25-tree forest') +
        legend([['Three of the individual trees', 'k-thin'], ['Forest average (25 trees)', 'k-line']]) +
        `<p class="mc-note">With only one input here, the randomness comes from resampling the days.</p>` + mae(f);
    }
    if (id === 'boosting') {
      const f1 = E.fitBoosting(tr, 1, 0.3, 1), f5 = E.fitBoosting(tr, 5, 0.3, 1), f50 = E.fitBoosting(tr, 50, 0.3, 1);
      return chartSVG(axes('Meals') + `<g clip-path="url(#mc-clip-${id})">${curve(f1, 'mc-thin')}${curve(f5, 'mc-line2')}${curve(f50, 'mc-line')}</g>` + dots(tr), 'Gradient boosting after 1, 5 and 50 rounds of small trees') +
        legend([['After 1 round', 'k-thin'], ['After 5 rounds', 'k-line2'], ['After 50 rounds', 'k-line']]) +
        `<p class="mc-note">Validation error: 1 round <b>${E.mae(D.validation, f1).toFixed(1)}</b>, 5 rounds <b>${E.mae(D.validation, f5).toFixed(1)}</b>, 50 rounds <b>${E.mae(D.validation, f50).toFixed(1)}</b> meals.</p>`;
    }
    if (id === 'kmeans') {
      const pts = E.locations(), r = E.kmeans(pts, 3), cls = ['mc-c1', 'mc-c2', 'mc-c3'];
      return chartSVG(axes('North', 100, 'East', [0, 50, 100]) + pts.map((p, i) => `<circle cx="${X(p[0])}" cy="${Y(p[1], 100)}" r="3.6" class="${cls[r.assignments[i]]}"/>`).join('') + r.centres.map((c, i) => `<path d="M${X(c[0]) - 6} ${Y(c[1], 100) - 6}l12 12m0 -12l-12 12" class="${cls[i]}-x"/>`).join(''), 'Fictional delivery locations grouped into three clusters') +
        legend([['Three clusters', 'k-c'], ['Cluster centres', 'k-x']]) + `<p class="mc-note">28 fictional delivery locations, k = 3.</p>`;
    }
    if (id === 'neural') {
      const layers = [2, 4, 4, 1], xs = [50, 130, 210, 285], nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => [xs[li], 95 + (i - (n - 1) / 2) * 34]));
      let lines = ''; for (let li = 0; li < 3; li++) nodes[li].forEach(a => nodes[li + 1].forEach(b => { lines += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" class="mc-gap"/>`; }));
      return chartSVG(lines + nodes.flat().map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" class="mc-node"/>`).join('') + ['Inputs', 'Hidden layer', 'Hidden layer', 'Output'].map((t, i) => `<text x="${xs[i]}" y="178" text-anchor="middle" class="mc-axis">${t}</text>`).join(''), 'Diagram of a small neural network with two hidden layers') +
        `<p class="mc-note"><b>Architecture illustration.</b> Each line represents a weight a network learns during training. Real networks can have billions.</p>`;
    }
    return '';
  }
  function mae(f) { return `<p class="mc-note">Error on the kitchen validation days: <b>${E.mae(E.data(42).validation, f).toFixed(1)} meals</b> (straight line: ${E.mae(E.data(42).validation, E.fitLinear(E.data(42).train)).toFixed(1)}).</p>`; }

  const link = r => `<a href="${r.url}"${r.internal ? '' : ' target="_blank" rel="noopener noreferrer"'}>${r.t}${r.internal ? ' →' : ' ↗'}</a>`;

  /* ---------- Panel shown inside a lesson ---------- */
  function panel(lessonId) {
    const m = METHODS.find(x => x.lesson === lessonId);
    if (!m) return '';
    return `<section class="ml-method-panel" id="how-it-works"><p class="ml-eyebrow">HOW IT WORKS · THE METHOD IN THIS LESSON</p><h2>${m.name}</h2><p class="ml-method-task">${m.task}</p>
      <div class="ml-method-grid2"><div><h3>The idea</h3><p>${m.idea}</p><h3>How it learns</h3><p>${m.learns}</p><h3>Reading the output</h3><p>${m.output}</p></div><div class="ml-method-chart">${chart(m.id)}</div></div>
      <div class="ml-method-lists"><div><h3>Use it when</h3><ul>${m.use.map(x => `<li>${x}</li>`).join('')}</ul></div><div><h3>Watch out for</h3><ul>${m.watch.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
      <p class="ml-method-more"><a href="methods.html#${m.id}">Compare it with nine other methods in the Methods guide →</a></p></section>`;
  }

  /* ---------- Full Methods guide page ---------- */
  function guide(root) {
    const fam = { number: 'Predicts a number', category: 'Predicts a category', both: 'Number or category', groups: 'Finds groups' };
    root.innerHTML = `<nav class="mg-jump" aria-label="Methods">${METHODS.map(m => `<a href="#${m.id}">${m.name}</a>`).join('')}</nav>
      <section class="mg-compare"><h2>At a glance</h2><div class="ml-table-wrap"><table><thead><tr><th scope="col">Method</th><th scope="col">Predicts</th><th scope="col">Follows curves?</th><th scope="col">Easy to explain?</th></tr></thead><tbody>${COMPARE.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>
      <p class="mc-note">A useful habit: start with the simplest method that could work (often linear or logistic regression), then try a more flexible one and compare them fairly, as in Lesson 6.</p></section>
      ${METHODS.map((m, i) => `<article class="mg-card" id="${m.id}"><div class="mg-head"><span class="mg-num">${String(i + 1).padStart(2, '0')}</span><div><h2>${m.name}</h2><span class="ml-tag live">${m.task}</span>${m.lesson ? ` <a class="ml-tag" href="lesson.html?lesson=${m.lesson}">Used in a lesson →</a>` : ''}</div></div>
        <div class="ml-method-grid2"><div><h3>The idea</h3><p>${m.idea}</p><h3>How it learns</h3><p>${m.learns}</p><h3>Reading the output</h3><p>${m.output}</p></div><div class="ml-method-chart">${chart(m.id)}</div></div>
        <div class="ml-method-lists"><div><h3>Use it when</h3><ul>${m.use.map(x => `<li>${x}</li>`).join('')}</ul></div><div><h3>Watch out for</h3><ul>${m.watch.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
        <details class="ml-tech"><summary>In Python<span>Optional: the scikit-learn starting point</span></summary><pre>${m.python}</pre></details>
        <p class="mg-read"><b>Read more:</b> ${m.read.map(link).join(' · ')}</p></article>`).join('')}`;
  }

  window.MLMethods = { list: METHODS, panel, guide, chart };
  const root = document.getElementById('methods-root');
  if (root && E) guide(root);
})();
