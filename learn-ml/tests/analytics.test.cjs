'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', '..');

function load({ hostname = 'codewithimpact.com', saved = {}, navigator = {}, blocked = false, privacy = false } = {}) {
  const storage = { ...saved }, scripts = [], events = [], listeners = {};
  const button = { textContent: '', hidden: false, addEventListener(type, callback) { this[type] = callback; } };
  const status = { textContent: '' };
  const localStorage = {
    getItem(key) { if (blocked) throw Error('Storage unavailable'); return storage[key] ?? null; },
    setItem(key, value) { if (blocked) throw Error('Storage unavailable'); storage[key] = value; },
    removeItem(key) { if (blocked) throw Error('Storage unavailable'); delete storage[key]; }
  };
  const context = {
    localStorage, navigator, location: { hostname, pathname: '/privacy.html' },
    window: { localStorage, goatcounter: { count(event) { events.push(event); } } },
    document: {
      createElement() { return { setAttribute() {} }; },
      head: { appendChild(script) { scripts.push(script); } },
      addEventListener(type, callback) { listeners[type] = callback; },
      getElementById(id) { return id === 'gc-toggle' ? button : status; }
    }
  };
  vm.createContext(context);
  if (privacy) {
    const html = fs.readFileSync(path.join(site, 'privacy.html'), 'utf8');
    const inline = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
    vm.runInContext(inline, context, { filename: 'privacy.html' });
  }
  vm.runInContext(fs.readFileSync(path.join(site, 'analytics.js'), 'utf8'), context, { filename: 'analytics.js' });
  function click(href = 'https://www.linkedin.com/company/106826547/', attributes = {}) {
    const link = { textContent: 'Follow us', getAttribute(name) { return name === 'href' ? href : attributes[name] ?? null; } };
    listeners.click?.({ target: { closest() { return link; } } });
  }
  return { storage, scripts, events, button, status, context, click };
}

test('only the two production hostnames load the analytics tracker', () => {
  for (const hostname of ['codewithimpact.com', 'www.codewithimpact.com']) {
    const page = load({ hostname });
    assert.equal(page.scripts.length, 1);
    page.click();
    assert.equal(page.events.length, 1);
  }
  for (const hostname of ['', 'localhost', '127.0.0.1', 'preview.example.com', 'codewithimpact.com.example.com']) {
    const page = load({ hostname });
    assert.equal(page.scripts.length, 0);
    page.click();
    assert.equal(page.events.length, 0);
  }
});

test('saved opt-out and browser privacy signals prevent tracker loading', () => {
  for (const options of [{ saved: { skipgc: 't' } }, { navigator: { globalPrivacyControl: true } }, { navigator: { doNotTrack: '1' } }]) {
    const page = load(options);
    assert.equal(page.scripts.length, 0);
    page.click();
    assert.equal(page.events.length, 0);
  }
});

test('opting out on the privacy page stops outbound events immediately and persists the choice', () => {
  const page = load({ privacy: true });
  page.click();
  assert.equal(page.events.length, 1);
  page.button.click();
  assert.equal(page.storage.skipgc, 't');
  assert.equal(page.context.window.cwiAnalyticsOff, true);
  assert.match(page.status.textContent, /off on this device/);
  page.click();
  assert.equal(page.events.length, 1);
});

test('outbound events respect a preference or privacy signal changed after page load', () => {
  const page = load();
  page.storage.skipgc = 't';
  page.click();
  assert.equal(page.events.length, 0);
  delete page.storage.skipgc;
  page.context.navigator.globalPrivacyControl = true;
  page.click();
  assert.equal(page.events.length, 0);
});

test('blocked browser storage still lets a visitor opt out for the current page with accurate feedback', () => {
  const page = load({ blocked: true, privacy: true });
  page.button.click();
  assert.equal(page.context.window.cwiAnalyticsOff, true);
  assert.match(page.status.textContent, /off for this page visit/);
  assert.match(page.status.textContent, /blocked saving/);
  page.click();
  assert.equal(page.events.length, 0);
});

test('turning analytics back on clears the preference and explains when tracking resumes', () => {
  const page = load({ saved: { skipgc: 't' }, privacy: true });
  page.button.click();
  assert.equal(page.storage.skipgc, undefined);
  assert.equal(page.context.window.cwiAnalyticsOff, false);
  assert.match(page.status.textContent, /on for future page visits/);
});

test('course completion links count once through the site handler and respect a later opt-out', () => {
  const html = fs.readFileSync(path.join(site, 'learn', 'validating-ai-in-use.html'), 'utf8');
  assert.doesNotMatch(html, /data-goatcounter-click/);
  for (const action of ['volunteer', 'partner', 'subscribe']) {
    assert.ok(html.includes('data-cwi-analytics-event="learn-complete-' + action + '"'));
  }
  const page = load();
  const attributes = { 'data-cwi-analytics-event': 'learn-complete-volunteer', 'data-cwi-analytics-title': 'Learn path end: Volunteer' };
  page.click('https://docs.google.com/forms/', attributes);
  assert.equal(page.events.length, 1);
  assert.equal(page.events[0].path, 'learn-complete-volunteer');
  assert.equal(page.events[0].title, 'Learn path end: Volunteer');
  page.storage.skipgc = 't';
  page.click('https://docs.google.com/forms/', attributes);
  assert.equal(page.events.length, 1);
});
