'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ML = require('../ml-engine.js');

function methods(engine = ML) {
  const context = { window: { MLEngine: engine }, document: { getElementById: () => null } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'methods-content.js'), 'utf8'), context);
  return context.window.MLMethods;
}

test('the forest chart draws three members of the ensemble it reports', () => {
  let forest;
  const engine = { ...ML, fitForest(...args) { forest = ML.fitForest(...args); return forest; } };
  const html = methods(engine).chart('forest');
  const lines = [...html.matchAll(/<polyline class="mc-thin" points="([^"]+)"/g)];
  assert.equal(lines.length, 3);
  lines.forEach((line, treeIndex) => {
    line[1].split(' ').forEach(point => {
      const [pixelX, pixelY] = point.split(',').map(Number);
      const visitors = (pixelX - 34) / 276 * 100;
      const meals = (1 - (pixelY - 12) / 152) * 175;
      assert.ok(Math.abs(meals - forest.trees[treeIndex](visitors)) < 1e-8);
    });
  });
});

test('displayed tree rules make the same decisions as the fitted tree near every split', () => {
  const tree = ML.fitTree(ML.data().train, 2, 2);
  const html = methods().chart('tree');
  const ruleList = html.match(/<ul class="mc-rules">([\s\S]*?)<\/ul>/)[1];
  const rules = [...ruleList.matchAll(/<li>(.*?)<\/li>/g)].map(([, rule]) => ({
    comparisons: [...rule.matchAll(/visitors (&lt;|≥) ([\d.]+)/g)].map(([, operator, cut]) => ({ operator, cut: Number(cut) })),
    prediction: Number(rule.match(/<b>(\d+) meals<\/b>/)[1])
  }));
  const cuts = [...new Set(rules.flatMap(rule => rule.comparisons.map(comparison => comparison.cut)))];
  const probes = [0, 61.1, 100, ...cuts.flatMap(cut => [cut - 1e-6, cut, cut + 1e-6])];
  probes.forEach(x => {
    const matches = rules.filter(rule => rule.comparisons.every(({ operator, cut }) => operator === '&lt;' ? x < cut : x >= cut));
    assert.equal(matches.length, 1, `one rule should cover ${x} visitors`);
    assert.equal(matches[0].prediction, Math.round(tree(x)), `rule and fitted prediction should agree at ${x}`);
  });
  assert.match(html, /leaf predictions are rounded to the nearest meal/);
});

test('all guide charts have unique clip IDs and refer to their own SVG definitions', () => {
  const root = { innerHTML: '' };
  methods().guide(root);
  const ids = [...root.innerHTML.matchAll(/<clipPath id="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, svg] of root.innerHTML.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g)) {
    const ownId = svg.match(/<clipPath id="([^"]+)"/)[1];
    for (const [, reference] of svg.matchAll(/clip-path="url\(#([^)]*)\)"/g)) assert.equal(reference, ownId);
  }
});
