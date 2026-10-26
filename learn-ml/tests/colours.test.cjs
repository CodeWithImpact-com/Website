'use strict';
// Every page loads colours.css once, straight after typography.css, so colour roles are the same everywhere.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const pages = [
  ...fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => f),
  ...fs.readdirSync(path.join(root, 'learn')).filter(f => f.endsWith('.html')).map(f => 'learn/' + f),
  ...fs.readdirSync(path.join(root, 'learn-ml')).filter(f => f.endsWith('.html')).map(f => 'learn-ml/' + f),
];

test('every page loads colours.css once, after typography.css', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const links = [...html.matchAll(/<link[^>]+href="([^"]+\.css)[^"]*"/g)].map(m => m[1]);
    const c = links.filter(h => /(?:^|\/)colours\.css$/.test(h));
    assert.strictEqual(c.length, 1, page + ' should load colours.css once');
    const t = links.findIndex(h => /typography\.css$/.test(h));
    assert.ok(links.indexOf(c[0]) > t, page + ': colours.css must come after typography.css');
  }
});

test('colour roles: brand fills kept, text coral is the darker shade', () => {
  const css = fs.readFileSync(path.join(root, 'colours.css'), 'utf8');
  assert.match(css, /--cwi-coral:#ED7B74/);
  assert.match(css, /--cwi-gold:#F5BD69/);
  assert.match(css, /--cwi-navy:#102033/);
  assert.match(css, /--cwi-coral-ink:#A8443C/);
  assert.match(css, /\.btn\.primary,\.ml-btn:not\(\.secondary\)\{color:var\(--cwi-navy\)!important\}/);
});
