'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Small DOM/event fixture for the shipped glossary script. Pointer travel and
// focus state are modelled; real browser geometry and assistive tech are not.
class Element {
  constructor(tag, document, attributes = {}) {
    this.tagName = tag.toLowerCase(); this.ownerDocument = document;
    this.attributes = attributes; this.children = []; this.listeners = {};
    this.style = {}; this.hidden = false; this.offsetHeight = 100;
    this.dataset = new Proxy({}, {
      get: (_, key) => this.attributes['data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase())],
      set: (_, key, value) => { this.attributes['data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase())] = String(value); return true; }
    });
    this.classList = { contains: name => this.className.split(/\s+/).includes(name) };
  }
  get className() { return this.attributes.class || ''; }
  set className(value) { this.attributes.class = value; }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.attributes.id = value; }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.children = [String(value)]; }
  set innerHTML(value) { this.children = []; parse(value, this); }
  get innerHTML() { return this.children.map(child => typeof child === 'string' ? child : '<' + child.tagName + '>' + child.innerHTML + '</' + child.tagName + '>').join(''); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  replaceWith(child) { const parent = this.parentElement; child.parentElement = parent; parent.children[parent.children.indexOf(this)] = child; this.parentElement = null; }
  contains(element) { for (let node = element; node; node = node.parentElement) if (node === this) return true; return false; }
  matches(selector) {
    return selector.split(',').some(part => {
      const token = part.trim();
      if (token.startsWith('.')) return this.classList.contains(token.slice(1));
      if (token.startsWith('#')) return this.id === token.slice(1);
      const match = token.match(/^([a-z0-9-]+)?(?:\[([^=\]]+)(?:="([^"]*)")?\])?$/);
      return !!match && (!match[1] || this.tagName === match[1]) && (!match[2] || this.getAttribute(match[2]) !== null && (match[3] === undefined || this.getAttribute(match[2]) === match[3]));
    });
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  querySelectorAll(selector) {
    const found = [];
    const visit = node => node.children.forEach(child => { if (typeof child !== 'string') { if (child.matches(selector)) found.push(child); visit(child); } });
    visit(this); return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getBoundingClientRect() { return { left: 100, top: 100, right: 180, bottom: 120, width: 80, height: 20 }; }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  fire(type, properties = {}) {
    const event = { type, target: this, preventDefault() {}, ...properties };
    for (let node = this; node; node = node.parentElement) (node.listeners[type] || []).forEach(callback => callback(event));
    (this.ownerDocument.listeners[type] || []).forEach(callback => callback(event));
  }
}
function parse(html, parent) {
  const stack = [parent], voids = new Set(['input', 'br', 'meta', 'link']);
  for (const token of String(html).match(/<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([a-z0-9-]+)/i)[1], attrs = {};
      for (const match of token.slice(tag.length + 1, -1).matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) attrs[match[1]] = match[2] || '';
      const element = new Element(tag, parent.ownerDocument, attrs);
      stack.at(-1).appendChild(element);
      if (!voids.has(tag)) stack.push(element);
    } else stack.at(-1).children.push(token);
  }
}
function load(html, options = {}) {
  const timers = new Map(); let timerId = 0, time = 0;
  const document = {
    listeners: {}, readyState: 'complete', activeElement: null,
    addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
    createElement(tag) { return new Element(tag, document); },
    querySelectorAll(selector) { return this.body.querySelectorAll(selector); },
    querySelector(selector) { return this.body.querySelector(selector); },
    getElementById(id) { return this.querySelector('#' + id); }
  };
  document.body = new Element('body', document);
  parse(html + '<script src="../glossary.js?v=11"></script>', document.body);
  const window = { innerWidth: 1000, innerHeight: 800, scrollX: 0, scrollY: 0, listeners: {}, addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); } };
  const context = { document, window, setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, due: time + delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../glossary.js'), 'utf8'), context);
  function advance(milliseconds) {
    const until = time + milliseconds;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.due <= until).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      time = next[1].due; timers.delete(next[0]); next[1].callback();
    }
    time = until;
  }
  if (!options.noStart) advance(60);
  return { document, window, api: window.CWIGlossary, advance, all: selector => document.querySelectorAll(selector), $: selector => document.querySelector(selector), focus(element) {
    const previous = document.activeElement; document.activeElement = element;
    if (previous) previous.fire('focusout', { relatedTarget: element });
    if (element) element.fire('focusin', { relatedTarget: previous });
  } };
}
const lesson = content => '<main id="lesson-root">' + content + '</main><aside class="ml-sidebar"><div class="learning-nav-resources"></div></aside>';

test('ordinary prose is never annotated; only deliberate markers receive a definition', () => {
  const fixture = load(lesson('<h1>Model and token</h1><p>A model uses tokens. <span data-term="token">tokens</span> are useful here.</p><p>Other models use embeddings.</p>'));
  assert.equal(fixture.all('.gl-term').length, 1);
  assert.equal(fixture.$('.gl-term').textContent, 'tokens');
  assert.equal(fixture.$('h1').textContent, 'Model and token');
  assert.equal(fixture.all('p')[1].textContent, 'Other models use embeddings.');
});

test('aliases share one optional lookup; clustering and k-means stay separate; repeated annotation is safe', () => {
  const fixture = load(lesson('<span data-term="models">models</span> <span data-term="model">model again</span> <span data-term="clustering">groups</span> <span data-term="k-means">k-means</span> <span data-term="unknown">unknown</span><a href="#"><span data-term="token">linked token</span></a>'));
  fixture.api.annotate(); fixture.api.annotate();
  assert.equal(fixture.all('.gl-term').length, 3);
  assert.equal(fixture.$('[data-term="model"]').textContent, 'models');
  assert.equal(fixture.all('span').find(element => element.textContent === 'model again').className, '');
  assert.equal(fixture.$('[data-term="unknown"]').tagName, 'span');
  assert.equal(fixture.$('a').querySelector('.gl-term'), null);
  assert.equal(fixture.all('.gl-link').length, 1);
  assert.equal(fixture.$('.gl-link').href, '../glossary.html');
  assert.equal(fixture.$('.gl-link').parentElement.className, 'learning-nav-resources');
});

test('reviewed definitions distinguish methods, geometry, changing data, and model inputs', () => {
  const { api } = load(lesson(''));
  assert.notEqual(api.getTerm('clustering'), api.getTerm('k-means'));
  assert.match(api.getTerm('nearest neighbours').def, /numbers for regression.*categories for classification/);
  assert.match(api.getTerm('naive-bayes').def, /independent within each category/);
  assert.match(api.getTerm('drift').def, /gradually or suddenly/);
  assert.match(api.getTerm('token').def, /punctuation/);
  assert.match(api.getTerm('cosine-similarity').def, /does not prove/);
  assert.equal(api.getTerm('similarity score'), null);
});

test('pointer can cross the gap and read a hovered definition until leaving both surfaces', () => {
  const fixture = load(lesson('<span data-term="token">token</span>'));
  const button = fixture.$('.gl-term'); button.fire('mouseover');
  const tip = fixture.$('.gl-tip'); assert.equal(tip.hidden, false);
  button.fire('mouseout', { relatedTarget: null }); fixture.advance(100);
  assert.equal(tip.hidden, false, 'gap crossing does not dismiss the tooltip immediately');
  tip.fire('mouseover', { relatedTarget: button }); fixture.advance(400);
  assert.equal(tip.hidden, false, 'hovering the definition keeps it open');
  tip.fire('mouseout', { relatedTarget: null }); fixture.advance(240);
  assert.equal(tip.hidden, true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.getAttribute('aria-describedby'), null);
});

test('focusing a new term clears the previously pinned trigger and Escape clears the next', () => {
  const fixture = load(lesson('<span data-term="token">token</span> <span data-term="model">model</span>'));
  const [first, second] = fixture.all('.gl-term');
  first.fire('click'); fixture.focus(second);
  assert.equal(first.getAttribute('aria-expanded'), 'false');
  assert.equal(first.getAttribute('aria-describedby'), null);
  assert.equal(second.getAttribute('aria-expanded'), 'true');
  assert.equal(second.getAttribute('aria-describedby'), 'gl-tip');
  second.fire('keydown', { key: 'Escape' });
  assert.equal(fixture.$('.gl-tip').hidden, true);
  assert.equal(second.getAttribute('aria-expanded'), 'false');
  assert.equal(second.getAttribute('aria-describedby'), null);
});

test('touch toggles a definition, outside clicks dismiss it, and Tab leaving its trigger closes it', () => {
  const fixture = load(lesson('<span data-term="model">model</span><button id="next">Continue</button>'));
  const button = fixture.$('.gl-term'); button.fire('click');
  assert.equal(fixture.$('.gl-tip').hidden, false);
  button.fire('click'); assert.equal(fixture.$('.gl-tip').hidden, true);
  button.fire('click'); fixture.$('#next').fire('click');
  assert.equal(fixture.$('.gl-tip').hidden, true);
  fixture.focus(button); button.fire('click'); fixture.focus(fixture.$('#next')); fixture.advance(240);
  assert.equal(fixture.$('.gl-tip').hidden, true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
});

test('the glossary page remains searchable after changing to authored lesson markers', () => {
  const fixture = load('<main id="glossary-root"></main>');
  const entries = fixture.all('.gl-entry'), filter = fixture.$('#gl-filter');
  assert.ok(entries.length > 60);
  filter.value = 'naive bayes'; filter.fire('input');
  assert.equal(entries.filter(entry => !entry.hidden).length, 1);
  filter.value = 'does-not-exist'; filter.fire('input');
  assert.equal(entries.filter(entry => !entry.hidden).length, 0);
  assert.equal(fixture.$('.gl-none').hidden, false);
});
