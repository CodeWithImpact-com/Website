'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const directory = path.join(__dirname, '..', '..', 'learn');
const source = fs.readFileSync(path.join(directory, 'learning-path.js'), 'utf8');

// Execute the actual landing script with a small DOM fixture. These checks cover
// course navigation and saved progress; they do not measure browser rendering.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.dataset = {};
    this.disabled = false;
    this._text = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; this._text = ''; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  click() { if (!this.disabled) this.listeners.click?.(); }
}

function setup(saved = {}, blocked = false) {
  const nodes = Object.fromEntries([
    'module-container', 'storage-note', 'course-progress', 'ai-progress-bar',
    'resume-link', 'hero-start-link', 'prompt-demo-input', 'prompt-demo-output',
    'prompt-demo-feedback'
  ].map(id => [id, new Element()]));
  const buttons = ['vague', 'specific'].map(key => Object.assign(new Element('button'), {
    dataset: { promptExample: key }, disabled: true
  }));
  const events = {};
  const localStorage = {
    getItem(key) { if (blocked) throw new Error('Storage is blocked'); return saved[key] ?? null; }
  };
  const document = {
    getElementById: id => nodes[id],
    createElement: tag => new Element(tag),
    querySelectorAll: () => buttons
  };
  vm.runInNewContext(source, {
    document, localStorage,
    window: { addEventListener: (name, callback) => { events[name] = callback; } }
  });
  const grids = () => nodes['module-container'].children.filter(node => node.className === 'ml-lessons');
  const cards = () => grids().flatMap(grid => grid.children);
  return { nodes, buttons, events, saved, grids, cards };
}

test('AI course presents all 12 lessons in order with one initial starting point', () => {
  const page = setup();
  assert.equal(page.grids().length, 4);
  assert.equal(page.cards().length, 12);
  assert.deepEqual(page.cards().map(card => card.children[0].children[0].textContent),
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')));
  assert.equal(page.nodes['course-progress'].textContent, '0 of 12 lessons completed');
  assert.equal(page.nodes['resume-link'].href, 'ai-made-simple.html');
  assert.equal(page.nodes['hero-start-link'].href, 'ai-made-simple.html');
});

test('AI course resumes the first unfinished lesson from existing completion keys', () => {
  const page = setup({
    'cwi-learn-ai-made-simple': 'complete',
    'cwi-learn-prompting-and-context': 'complete',
    'cwi-learn-inside-an-llm': 'in-progress',
    'cwi-learn-unknown-lesson': 'complete'
  });
  assert.equal(page.nodes['course-progress'].textContent, '2 of 12 lessons completed');
  assert.equal(page.nodes['resume-link'].href, 'inside-an-llm.html');
  assert.equal(page.nodes['hero-start-link'].href, 'inside-an-llm.html');
  assert.equal(page.nodes['ai-progress-bar'].value, 2);
  assert.match(page.cards()[0].textContent, /Completed/);
  assert.match(page.cards()[1].textContent, /Ready to explore/);
  assert.match(page.cards()[2].textContent, /Completed/);
});

test('returning to the AI course refreshes completion and resume links', () => {
  const page = setup({ 'cwi-learn-ai-made-simple': 'complete' });
  page.saved['cwi-learn-inside-an-llm'] = 'complete';
  page.events.pageshow();
  assert.equal(page.nodes['course-progress'].textContent, '2 of 12 lessons completed');
  assert.equal(page.nodes['resume-link'].href, 'prompting-and-context.html');
  assert.equal(page.nodes['hero-start-link'].href, 'prompting-and-context.html');
});

test('cross-tab completion reset and clearing storage refresh the AI course', () => {
  const page = setup({
    'cwi-learn-ai-made-simple': 'complete',
    'cwi-learn-inside-an-llm': 'complete'
  });
  delete page.saved['cwi-learn-ai-made-simple'];
  page.events.storage({ key: 'cwi-learn-ai-made-simple' });
  assert.equal(page.nodes['course-progress'].textContent, '1 of 12 lessons completed');
  assert.equal(page.nodes['resume-link'].href, 'ai-made-simple.html');
  delete page.saved['cwi-learn-inside-an-llm'];
  page.events.storage({ key: null });
  assert.equal(page.nodes['course-progress'].textContent, '0 of 12 lessons completed');
  assert.equal(page.nodes['ai-progress-bar'].value, 0);
  assert.match(page.cards()[1].textContent, /Ready to explore/);
});

test('finishing every AI lesson changes both primary actions to review', () => {
  const initial = setup();
  const saved = {};
  for (const card of initial.cards()) {
    const url = card.children[3].children[1].href;
    saved['cwi-learn-' + url.replace(/\.html$/, '')] = 'complete';
  }
  const page = setup(saved);
  assert.equal(page.nodes['course-progress'].textContent, '12 of 12 lessons completed');
  assert.equal(page.nodes['resume-link'].href, '#learning-path');
  assert.equal(page.nodes['hero-start-link'].href, '#learning-path');
  assert.match(page.nodes['resume-link'].textContent, /Revisit/);
  assert.equal(page.nodes['ai-progress-bar'].value, 12);
});

test('blocked browser storage leaves all AI lessons and the hero example available', () => {
  const page = setup({}, true);
  assert.match(page.nodes['storage-note'].textContent, /blocking saved progress/);
  assert.equal(page.cards().length, 12);
  assert.equal(page.nodes['resume-link'].href, 'ai-made-simple.html');
  assert.ok(page.buttons.every(button => !button.disabled));
  page.buttons[1].click();
  assert.match(page.nodes['prompt-demo-output'].textContent, /Riverside Hall/);
});

test('AI hero example switches authored prompts, explanations and button states', () => {
  const page = setup();
  page.buttons[1].click();
  assert.match(page.nodes['prompt-demo-input'].textContent, /Riverside Hall/);
  assert.match(page.nodes['prompt-demo-output'].textContent, /reply by Friday/);
  assert.match(page.nodes['prompt-demo-feedback'].textContent, /not a guarantee/);
  assert.equal(page.buttons[0].attributes['aria-pressed'], 'false');
  assert.equal(page.buttons[1].attributes['aria-pressed'], 'true');
  page.buttons[0].click();
  assert.equal(page.nodes['prompt-demo-input'].textContent, 'Write an update for our volunteers.');
  assert.equal(page.buttons[0].attributes['aria-pressed'], 'true');
  assert.equal(page.buttons[1].attributes['aria-pressed'], 'false');
});

test('AI landing keeps existing lesson keys, accessible labels and valid local destinations', () => {
  const page = setup();
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  for (const card of page.cards()) {
    const action = card.children[3].children[1];
    const lesson = fs.readFileSync(path.join(directory, action.href), 'utf8');
    const slug = action.href.replace(/\.html$/, '');
    assert.match(lesson, new RegExp('"slug"\\s*:\\s*"' + slug + '"'));
    assert.match(action.attributes['aria-label'], /lesson \d+:/);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const destination = match[1].split(/[?#]/)[0];
    if (/^[a-z]+:/.test(destination)) continue;
    assert.ok(fs.existsSync(path.resolve(directory, destination)), destination);
  }
  const ids = html.match(/id="[^"]+"/g) || [];
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(!html.includes('data-track='));
  assert.ok(html.includes('../learn-ml/ml.css'));
  assert.match(html, /Both responses are examples written by us, not live AI output/);
});
