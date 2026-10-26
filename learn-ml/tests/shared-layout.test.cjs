'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(base, 'learning-layout.js'), 'utf8');

// Small structural DOM fixture. These checks cover navigation order, disclosure
// state and preserved node identity, not browser rendering or native details UI.
class Element {
  constructor(tag, document, attributes = {}) {
    this.tagName = tag.toUpperCase(); this.ownerDocument = document;
    this.attributes = attributes; this.children = []; this.parentElement = null;
  }
  get id() { return this.getAttribute('id') || ''; }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class', value); }
  get open() { return Object.hasOwn(this.attributes, 'open'); }
  set open(value) { if (value) this.attributes.open = ''; else delete this.attributes.open; }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.children = [String(value)]; }
  set innerHTML(value) { this.children = []; parse(value, this); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
  appendChild(node) { node.remove(); node.parentElement = this; this.children.push(node); return node; }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null;
  }
  insertBefore(node, reference) {
    node.remove(); const index = reference ? this.children.indexOf(reference) : this.children.length;
    assert.ok(index >= 0); this.children.splice(index, 0, node); node.parentElement = this;
  }
  after(node) {
    if (node === this) return;
    const parent = this.parentElement; node.remove();
    parent.children.splice(parent.children.indexOf(this) + 1, 0, node); node.parentElement = parent;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const result = [];
    const matches = node => {
      if (selector.startsWith('#')) return node.id === selector.slice(1);
      if (selector.startsWith('.')) return node.className.split(/\s+/).includes(selector.slice(1));
      const attribute = selector.match(/^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (attribute) return (!attribute[1] || node.tagName === attribute[1].toUpperCase()) &&
        Object.hasOwn(node.attributes, attribute[2]) && (attribute[3] === undefined || node.getAttribute(attribute[2]) === attribute[3]);
      return node.tagName === selector.toUpperCase();
    };
    const visit = node => node.children.forEach(child => {
      if (typeof child === 'string') return;
      if (matches(child)) result.push(child);
      visit(child);
    });
    visit(this); return result;
  }
}

function parse(html, parent) {
  const stack = [parent], voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) || []) {
    if (/^<!--|^<!/.test(token)) continue;
    if (token.startsWith('</')) {
      const tag = token.slice(2, -1).trim().toUpperCase();
      while (stack.length > 1) if (stack.pop().tagName === tag) break;
    } else if (token.startsWith('<')) {
      const tag = token.match(/^<([^\s/>]+)/)[1].toLowerCase(), attributes = {};
      const rest = token.slice(tag.length + 1).replace(/\/?\s*>$/, '');
      for (const match of rest.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)) attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
      const node = new Element(tag, parent.ownerDocument, attributes);
      stack.at(-1).append(node);
      if (!voids.has(tag) && !token.endsWith('/>')) stack.push(node);
    } else stack.at(-1).children.push(token);
  }
}

function fixture(html, mobile, loading = false) {
  const listeners = {}, document = new Element('document');
  document.ownerDocument = document;
  document.createElement = tag => new Element(tag, document);
  document.getElementById = id => document.querySelector('#' + id);
  document.addEventListener = (name, callback) => { (listeners[name] ||= []).push(callback); };
  document.readyState = loading ? 'loading' : 'complete';
  parse(html, document);
  const media = { matches: !mobile, callbacks: [], addEventListener(name, callback) { assert.equal(name, 'change'); this.callbacks.push(callback); } };
  const context = vm.createContext({ document, window: { matchMedia: () => media }, URLSearchParams, location: { search: '' } });
  return { document, context, media, ready() { document.readyState = 'interactive'; (listeners.DOMContentLoaded || []).forEach(callback => callback()); } };
}

function mlFixture(id, mobile) {
  const page = fixture(fs.readFileSync(path.join(base, 'learn-ml/lesson.html'), 'utf8'), mobile);
  page.context.window.MLEngine = require('../ml-engine.js');
  page.context.location.search = '?lesson=' + id;
  vm.runInContext(fs.readFileSync(path.join(base, 'learn-ml/lesson-content.js'), 'utf8'), page.context);
  // Run the actual shipped template; the existing lesson tests separately cover
  // lab/quiz callbacks. Stop just after the template's assignment here.
  const lesson = fs.readFileSync(path.join(base, 'learn-ml/lesson.js'), 'utf8');
  const templateEnd = lesson.indexOf(' const quizRight=');
  assert.ok(templateEnd > 0, 'The generated lesson template must be present.');
  vm.runInContext(lesson.slice(0, templateEnd) + '\n})();', page.context);
  return page;
}

function assertLayout(page, ml, mobile) {
  const { document, context, media } = page;
  const ids = document.querySelectorAll('[id]').map(node => node.id).sort();
  const hrefs = document.querySelectorAll('a').map(node => node.getAttribute('href')).sort();
  const progress = document.getElementById(ml ? 'lesson-progress' : 'progress-bar');
  vm.runInContext(source, context, { filename: 'learning-layout.js' });
  const sidebar = document.querySelector(ml ? '.ml-sidebar' : '.toc');
  const current = sidebar.querySelector('.learning-nav-current');
  assert.equal(current.querySelector('summary').textContent, 'In this lesson');
  assert.equal(current.open, !mobile);
  assert.equal(sidebar.parentElement.children.filter(node => typeof node !== 'string')[0], sidebar);
  assert.equal(document.getElementById(ml ? 'lesson-progress' : 'progress-bar'), progress);
  assert.deepEqual(document.querySelectorAll('[id]').map(node => node.id).sort(), ids);
  // Learn AI gains the same course list and bottom links as Learn ML; every original link is kept.
  const added = ml ? [] : ['resources.html', 'credits.html', '../learn-ml/index.html',
    ...sidebar.querySelector('.learning-nav-course').querySelectorAll('a').map(node => node.getAttribute('href'))];
  const after = document.querySelectorAll('a').map(node => node.getAttribute('href'));
  for (const href of added) after.splice(after.indexOf(href), 1);
  assert.deepEqual(after.sort(), hrefs);
  const resources = sidebar.querySelector('.learning-nav-resources');
  assert.equal(resources.parentElement, sidebar, 'Secondary resources remain outside collapsed disclosures.');
  if (ml) {
    assert.equal(sidebar.querySelector('.learning-nav-course').open, false);
    assert.equal(current.querySelector('#lesson-progress'), progress);
    assert.equal(sidebar.querySelector('.learning-nav-course').querySelectorAll('a').length, 6);
  } else {
    const content = document.querySelector('.lesson-content');
    const sections = content.children.filter(node => typeof node !== 'string');
    assert.equal(sections.indexOf(content.querySelector('#deeper')), sections.indexOf(content.querySelector('#quiz')) + 1);
    const course = sidebar.querySelector('.learning-nav-course');
    assert.equal(course.open, false);
    assert.equal(course.querySelectorAll('a').length, 12);
    const bottom = resources.querySelectorAll('a').map(node => node.getAttribute('href'));
    for (const href of ['resources.html', 'credits.html', '../learn-ml/index.html']) assert.ok(bottom.includes(href), href);
    const links = current.querySelector('.learning-nav-links').querySelectorAll('a');
    assert.equal(links.findIndex(node => node.getAttribute('href') === '#deeper'), links.findIndex(node => node.getAttribute('href') === '#quiz') + 1);
  }
  const details = sidebar.querySelectorAll('details');
  context.window.CWILearningLayout.enhance();
  assert.deepEqual(sidebar.querySelectorAll('details'), details, 'Repeated mounting must reuse the same navigation.');
  assert.equal(media.callbacks.length, 1);
  media.matches = mobile; media.callbacks[0]();
  assert.equal(current.open, mobile, 'Crossing the breakpoint updates the disclosure default.');
}

test('all twelve AI lessons preserve navigation, progress and reading order on desktop and mobile', () => {
  const pages = fs.readdirSync(path.join(base, 'learn')).filter(name => name.endsWith('.html'))
    .map(name => fs.readFileSync(path.join(base, 'learn', name), 'utf8')).filter(html => html.includes('class="lesson-shell"'));
  assert.equal(pages.length, 12);
  for (const html of pages) for (const mobile of [false, true]) assertLayout(fixture(html, mobile), false, mobile);
});

test('all six generated ML lessons preserve progress, course links and mobile section navigation', () => {
  for (const id of ['framing','data','regression','classification','overfitting','comparison']) {
    for (const mobile of [false, true]) assertLayout(mlFixture(id, mobile), true, mobile);
  }
});

test('deferred initialization waits for static lesson content and runs once', () => {
  const page = fixture(fs.readFileSync(path.join(base, 'learn/ai-made-simple.html'), 'utf8'), true, true);
  vm.runInContext(source, page.context);
  assert.equal(page.document.querySelector('.learning-nav-current'), null);
  page.ready();
  assert.equal(page.document.querySelector('.learning-nav-current').open, false);
  page.context.window.CWILearningLayout.enhance();
  assert.equal(page.media.callbacks.length, 1);
});
