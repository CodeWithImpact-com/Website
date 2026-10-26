'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ML = require('../ml-engine.js');
const directory = path.join(__dirname, '..');

// A deliberately small DOM fixture executes the shipped lesson callbacks. It
// checks behaviour and generated content, not browser layout or native input UI.
class Element {
  constructor(tag, owner, attributes = {}) {
    this.tagName = tag.toLowerCase(); this.ownerDocument = owner;
    this.attributes = attributes; this.children = []; this.listeners = {};
    this.disabled = Object.hasOwn(attributes, 'disabled'); this.checked=Object.hasOwn(attributes,'checked');
    this._html = ''; this._value = attributes.value;
    this.classList = {
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); }
    };
  }
  get className() { return this.attributes.class || ''; }
  set className(value) { this.attributes.class = String(value); }
  get type() { return this.attributes.type||''; }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.attributes.id = String(value); }
  get dataset() { return Object.fromEntries(Object.entries(this.attributes).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value])); }
  get value() {
    if (this._value !== undefined) return this._value;
    if (this.tagName === 'textarea') return this.textContent;
    if (this.tagName === 'select') return this.querySelectorAll('option')[0]?.value || '';
    return '';
  }
  set value(value) { this._value = String(value); }
  get selectedOptions() { return this.querySelectorAll('option').filter(option => option.value === this.value); }
  get elements() { return { namedItem:name=>this.querySelectorAll('[name="'+name+'"]')[0]||null }; }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.children = [String(value)]; this._html = String(value); }
  get innerHTML() { return this._html; }
  set innerHTML(html) { this._html = String(html); this.children = []; parse(String(html), this); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  appendChild(child) {
    if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(existing => existing !== child);
    child.parentElement = this; this.children.push(child); return child;
  }
  insertAdjacentHTML(position, html) { assert.equal(position, 'beforeend'); parse(html, this); this._html += html; }
  addEventListener(event, callback) { (this.listeners[event] ||= []).push(callback); }
  fire(event, force = false) { if (!force && this.disabled && event === 'click') return; for(let node=this;node;node=node.parentElement)(node.listeners[event]||[]).forEach(callback=>callback({target:this,type:event,preventDefault(){}})); }
  dispatchEvent(event) {this.fire(event.type);return true;}
  remove() {if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(child=>child!==this);}
  querySelector(selector) {return this.querySelectorAll(selector)[0]||null;}
  click() { if (this.tagName === 'a' && this.download) this.ownerDocument.downloads.push({ filename: this.download, url: this.href }); this.fire('click'); }
  querySelectorAll(selector) {
    const found = [];
    const matches = element => {
      if (selector.startsWith('#')) return element.attributes.id === selector.slice(1);
      if (selector.startsWith('.')) return element.className.split(/\s+/).includes(selector.slice(1));
      const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return attribute ? Object.hasOwn(element.attributes, attribute[1]) && (attribute[2] === undefined || element.attributes[attribute[1]] === attribute[2]) : element.tagName === selector;
    };
    const visit = element => element.children.forEach(child => { if (typeof child === 'string') return; if (matches(child)) found.push(child); visit(child); });
    visit(this); return found;
  }
}

function parse(html, parent) {
  const stack = [parent], voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('<!--') || /^<!/i.test(token)) continue;
    if (token.startsWith('</')) { const tag = token.slice(2, -1).trim().toLowerCase(); while (stack.length > 1) if (stack.pop().tagName === tag) break; continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([^\s/>]+)/)[1].toLowerCase(), attributes = {};
      const rest = token.slice(1 + tag.length).replace(/\/?\s*>$/, '');
      for (const match of rest.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)) attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
      const element = new Element(tag, parent.ownerDocument, attributes);
      stack.at(-1).appendChild(element);
      if (!voids.has(tag) && !token.endsWith('/>')) stack.push(element);
    } else stack.at(-1).children.push(token.replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&'));
  }
}

function load(page = 'lesson', search = '', initial = {}, fail = {}) {
  const storage = { ...initial }, downloads = [], blobs = [], revoked = [];
  const document = {
    downloads, title: '',
    createElement: tag => new Element(tag, document),
    getElementById: id => document.root.querySelectorAll('#' + id)[0] || null,
    querySelectorAll: selector => document.root.querySelectorAll(selector)
  };
  document.root = new Element('document', document);
  parse(fs.readFileSync(path.join(directory, page === 'lesson' ? 'lesson.html' : page==='project'?'project.html':'index.html'), 'utf8'), document.root);
  document.body=document.querySelectorAll('body')[0];
  const context = {
    window: { MLEngine: ML,setTimeout:callback=>callback() }, Event:class {constructor(type,options={}){this.type=type;this.bubbles=options.bubbles;}}, document, location: { search }, URLSearchParams, Blob,
    URL: { createObjectURL(blob) { blobs.push(blob); return 'blob:test/' + blobs.length; }, revokeObjectURL(url) { revoked.push(url); } },
    setTimeout: callback => callback(),
    localStorage: {
      getItem(key) { if (fail.get) throw Error('Storage read unavailable'); return storage[key] ?? null; },
      setItem(key, value) { if (fail.set) throw Error('Storage write unavailable'); storage[key] = value; },
      removeItem(key) { if (fail.remove) throw Error('Storage removal unavailable'); delete storage[key]; }
    }
  };
  vm.createContext(context);
  for (const filename of page === 'lesson' ? ['learning-engine.js','lesson-extensions.js','lesson-content.js', 'methods-content.js', 'lesson.js'] : page==='project'?['project.js']:['course.js']) vm.runInContext(fs.readFileSync(path.join(directory, filename), 'utf8'), context, { filename });
  return { context, document, storage, downloads, blobs, revoked, $: id => document.getElementById(id) };
}

function values(fixture) { return fixture.$('lab-metrics').querySelectorAll('strong').map(element => element.textContent); }
function input(fixture, id, value, event = 'input') { const element = fixture.$(id); element.value = value; element.fire(event); }

test('all six lessons render their experiments, useful feedback and an accessible chart title', () => {
  for (const id of ['framing', 'data', 'regression', 'classification', 'overfitting', 'comparison']) {
    const fixture = load('lesson', '?lesson=' + id), lesson = fixture.context.window.MLLessons[id];
    assert.ok(fixture.document.title.startsWith(lesson.title));
    assert.ok(fixture.$('lab-body').children.length);
    const quiz = [{ correct: lesson.correct, explanation: lesson.explanation }, ...fixture.context.window.MLExtraQuestions[id]];
    assert.ok(quiz.length >= 3);
    quiz.forEach((item, qi) => {
      const answers = fixture.document.querySelectorAll('[data-q="' + qi + '"]');
      answers[(item.correct + 1) % answers.length].click();
      assert.ok(fixture.$('quiz-feedback-' + qi).textContent.includes(item.explanation));
      answers[item.correct].click();
      assert.equal(answers[item.correct].getAttribute('aria-pressed'), 'true');
      assert.ok(fixture.$('quiz-feedback-' + qi).textContent.startsWith('That’s right.'));
    });
    assert.match(fixture.$('quiz-score').textContent, new RegExp('All ' + quiz.length + ' correct'));
    if (fixture.$('lab-chart')) {
      assert.ok(fixture.$('lab-chart-title').textContent.length > 15);
      assert.doesNotMatch(fixture.$('lab-chart').innerHTML, /NaN|Infinity/);
    }
  }
});

test('invalid or prototype-like lesson URLs fall back safely to the first lesson', () => {
  for (const search of ['?lesson=missing', '?lesson=__proto__', '?lesson=%3Cscript%3E']) {
    const fixture = load('lesson', search);
    assert.ok(fixture.document.title.startsWith('Start with a useful question.'));
    assert.equal(fixture.document.querySelectorAll('[data-task]').length, 16);
  }
});

test('framing and leakage tasks change feedback for an answer and keep selection exclusive', () => {
  for (const id of ['framing', 'data']) {
    const fixture = load('lesson', '?lesson=' + id), choices = fixture.$('lab-body').querySelectorAll('[data-task="0"]');
    choices[1].click();
    assert.ok(fixture.$('task-feedback-0').textContent.startsWith('Consider this.'));
    choices[0].click();
    assert.ok(fixture.$('task-feedback-0').textContent.startsWith('Yes.'));
    assert.equal(choices.filter(choice => choice.getAttribute('aria-pressed') === 'true').length, 1);
  }
});

test('regression auto-fit uses training only, survives a split switch and yields to manual input', () => {
  const fixture = load('lesson', '?lesson=regression'), data = ML.data(), line = ML.fitLinear(data.train);
  const original = values(fixture);
  fixture.$('auto-fit').click();
  assert.equal(values(fixture)[0], ML.mae(data.train, line).toFixed(1));
  assert.equal(values(fixture)[1], ML.mae(data.validation, line).toFixed(1));
  assert.ok(Number(values(fixture)[1]) < Number(original[1]));
  input(fixture, 'show-split', 'validation', 'change');
  assert.equal(values(fixture)[1], ML.mae(data.validation, line).toFixed(1));
  assert.match(fixture.$('lab-note').textContent, /12 validation days/);
  input(fixture, 'slope', '0.50');
  const manual = x => 0.5 * x + Number(fixture.$('intercept').value);
  assert.equal(values(fixture)[0], ML.mae(data.train, manual).toFixed(1));
  assert.match(fixture.$('lab-note').textContent, /chosen coefficients/);
});

test('threshold slider uses real logistic-regression scores and updates recall, precision and flags', () => {
  const fixture = load('lesson', '?lesson=classification'), cases = ML.logisticCases();
  const expect = t => { const c = ML.confusion(cases, t); return [Math.round(c.recall * 100) + '%', Math.round(c.precision * 100) + '%', c.flagged + ' / ' + cases.length]; };
  assert.equal(cases.length, 16);
  assert.deepEqual(values(fixture), expect(0.5));
  for (const t of ['0.05', '0.3', '0.95']) { input(fixture, 'threshold', t); assert.deepEqual(values(fixture), expect(+t)); }
  input(fixture, 'threshold', '0.05');
  assert.equal(values(fixture)[0], '100%');
  assert.match(fixture.$('lab-note').textContent, /logistic regression fitted on 24/);
  assert.match(fixture.$('confusion').textContent, /Busy days missed/);
});

test('each lesson that uses a method shows a How it works panel; the others do not', () => {
  const expected = { framing: null, data: null, regression: 'Linear regression', classification: 'Logistic regression', overfitting: 'Polynomial regression', comparison: 'k-nearest neighbours' };
  for (const [id, name] of Object.entries(expected)) {
    const fixture = load('lesson', '?lesson=' + id), panel = fixture.$('how-it-works');
    if (!name) { assert.equal(panel, null); continue; }
    assert.ok(panel.querySelectorAll('h2')[0].textContent.includes(name));
    assert.doesNotMatch(panel.innerHTML, /NaN|undefined|Infinity/);
  }
});

test('degrees one, four and nine update actual scores and demonstrate the validation trade-off', () => {
  const fixture = load('lesson', '?lesson=overfitting'), data = ML.data(), scores = {};
  for (const degree of [1, 4, 9]) {
    input(fixture, 'degree', degree);
    const line = ML.fitPolynomial(data.train, degree);
    scores[degree] = values(fixture).slice(0, 2).map(Number);
    assert.deepEqual(values(fixture), [ML.mae(data.train, line).toFixed(1), ML.mae(data.validation, line).toFixed(1), 'Degree ' + degree]);
    assert.doesNotMatch(fixture.$('lab-chart').innerHTML, /NaN|Infinity/);
  }
  assert.ok(scores[4][1] < scores[1][1]);
  assert.ok(scores[9][0] < scores[4][0]);
  assert.ok(scores[9][1] > scores[4][1]);
});

test('comparison keeps test data hidden until a choice is locked and reveals it once', () => {
  const fixture = load('lesson', '?lesson=comparison'), data = ML.data();
  assert.equal(fixture.$('reveal-test').disabled, true);
  assert.equal(fixture.document.querySelectorAll('[data-download="test"]').length, 0);
  fixture.$('reveal-test').fire('click', true);
  assert.doesNotMatch(fixture.$('lab-note').textContent, /Final test MAE/);
  input(fixture, 'neighbours', 7);
  input(fixture, 'candidate', 'knn', 'change');
  fixture.$('lock-model').click();
  for (const id of ['neighbours', 'candidate', 'lock-model']) assert.equal(fixture.$(id).disabled, true);
  assert.equal(fixture.$('reveal-test').disabled, false);
  // A locked model is a snapshot, even if a script mutates a disabled control.
  fixture.$('candidate').value = 'mean'; fixture.$('neighbours').value = 1;
  fixture.$('reveal-test').click();
  const expected = ML.mae(data.test, ML.fitKNN(data.train, 7)).toFixed(1);
  assert.match(fixture.$('lab-note').textContent, new RegExp('locked nearest neighbours: ' + expected.replace('.', '\\.')));
  assert.equal(fixture.$('reveal-test').disabled, true);
  assert.equal(fixture.$('neighbours-value').textContent, '7');
  fixture.$('reveal-test').fire('click', true);
  for (const split of ['train', 'validation', 'test']) assert.equal(fixture.document.querySelectorAll('[data-download="' + split + '"]').length, 1);
});

test('CSV buttons download the actual split with a filename and release the object URL', async () => {
  const fixture = load('lesson', '?lesson=regression');
  fixture.document.querySelectorAll('[data-download="validation"]')[0].click();
  assert.equal(fixture.downloads[0].filename, 'kitchen-validation.csv');
  assert.equal(await fixture.blobs[0].text(), ML.csv(ML.data().validation));
  assert.deepEqual(fixture.revoked, [fixture.downloads[0].url]);
});

function answerAll(fixture, id) {
  const lesson = fixture.context.window.MLLessons[id];
  const quiz = [{ correct: lesson.correct }, ...fixture.context.window.MLExtraQuestions[id]];
  quiz.forEach((item, qi) => fixture.document.querySelectorAll('[data-q="' + qi + '"]')[item.correct].click());
}

test('a lesson completes automatically only after the experiment and all questions, and resets', () => {
  const fixture = load('lesson', '?lesson=regression', { 'cwi-ml-v7': JSON.stringify(['framing', 'unknown']) });
  answerAll(fixture, 'regression');
  assert.ok(!JSON.parse(fixture.storage['cwi-ml-v7']).includes('regression'));
  assert.match(fixture.$('progress-state').textContent, /Now try the experiment/);
  input(fixture, 'slope', 1.2);
  assert.deepEqual(JSON.parse(fixture.storage['cwi-ml-v7']), ['framing', 'regression']);
  fixture.$('auto-fit').click();
  assert.deepEqual(JSON.parse(fixture.storage['cwi-ml-v7']), ['framing', 'regression']);
  const reloaded = load('lesson', '?lesson=regression', fixture.storage);
  assert.match(reloaded.$('progress-state').textContent, /^Lesson complete/);
  reloaded.$('clear-progress').click();
  assert.equal(reloaded.storage['cwi-ml-v7'], undefined);
  assert.match(reloaded.$('progress-state').textContent, /Not complete/);
});

test('a wrong answer keeps the lesson incomplete', () => {
  const fixture = load('lesson', '?lesson=data');
  fixture.document.querySelectorAll('[data-task]')[0].click();
  answerAll(fixture, 'data');
  const lesson = fixture.context.window.MLLessons.data;
  fixture.document.querySelectorAll('[data-q="0"]')[(lesson.correct + 1) % 3].click();
  assert.match(fixture.$('quiz-score').textContent, /3 of 4/);
});

test('blocked or malformed storage leaves lessons usable and gives honest persistence feedback', () => {
  assert.doesNotThrow(() => load('lesson', '?lesson=data', { 'cwi-ml-v7': '{malformed' }));
  const blocked = load('lesson', '?lesson=data', {}, { get: true, set: true });
  blocked.document.querySelectorAll('[data-task]')[0].click(); answerAll(blocked, 'data');
  assert.match(blocked.$('save-status').textContent, /page visit only/);
  const cannotReset = load('lesson', '?lesson=data', { 'cwi-ml-v7': '["data"]' }, { remove: true });
  cannotReset.$('clear-progress').click();
  assert.match(cannotReset.$('save-status').textContent, /page visit|page only|reload/i);
});

test('all lessons share one path and optional technical detail, including legacy track URLs', () => {
 for(const search of ['?lesson=regression','?lesson=regression&track=build','?lesson=regression&track=explore']){
  const fixture=load('lesson',search);
  assert.equal(fixture.$('technical').getAttribute('open'),null);
  assert.match(fixture.$('technical').textContent,/Optional equations, code and project prompts/);
  const sidebar=fixture.document.querySelectorAll('.ml-sidebar')[0];
  assert.ok(sidebar.querySelectorAll('a').filter(a=>a.getAttribute('href').startsWith('lesson.html')).every(a=>!a.getAttribute('href').includes('track=')));
  assert.ok(!fixture.document.querySelectorAll('.ml-next')[0].getAttribute('href').includes('track='));
 }
});

test('one course resumes progress and all six lesson entry links use the same path',()=>{
 const fixture=load('course','',{'cwi-ml-v7':'["framing","framing","unknown"]'});
 assert.equal(fixture.$('course-progress').textContent,'1 of 6 lessons completed');
 assert.match(fixture.$('resume-link').href,/lesson=data/);
 assert.ok(!fixture.$('resume-link').href.includes('track='));
 assert.equal(fixture.document.querySelectorAll('[data-track]').length,0);
 const links=fixture.$('course-path').querySelectorAll('a').filter(a=>a.getAttribute('href').startsWith('lesson.html'));
 assert.equal(links.length,6);
 const notify=fixture.$('course-path').querySelectorAll('[data-cwi-analytics-event]');
 assert.equal(notify.length,6);
 assert.deepEqual(notify.map(a=>a.getAttribute('data-cwi-analytics-event')),['notify-clustering','notify-ensembles','notify-explain','notify-fairness','notify-forecasting','notify-capstone']);
 assert.ok(notify.every(a=>a.getAttribute('href').includes('docs.google.com/forms')&&a.textContent.startsWith('Notify me')));
 assert.ok(links.every(a=>!a.getAttribute('href').includes('track=')));
 assert.equal(fixture.$('course-path').querySelectorAll('.planned').length,6);
 const before=fixture.$('hero-feedback').textContent;
 input(fixture,'hero-fit',1.4);
 assert.notEqual(fixture.$('hero-feedback').textContent,before);
 assert.match(fixture.$('hero-feedback').textContent,/How would it do on new days/);
});

test('blank lab clicks and CSV downloads do not complete the experiment',()=>{
 const fixture=load('lesson','?lesson=regression');
 answerAll(fixture,'regression');
 fixture.$('lab-body').click();
 fixture.document.querySelectorAll('[data-download="train"]')[0].click();
 assert.match(fixture.$('progress-state').textContent,/Now try the experiment/);
 assert.equal(fixture.storage['cwi-ml-v7'],undefined);
 fixture.$('auto-fit').click();
 assert.match(fixture.$('progress-state').textContent,/Lesson complete/);
});

test('reset clears the current experiment and quiz so a lesson cannot immediately re-save',()=>{
 const fixture=load('lesson','?lesson=regression');
 fixture.$('auto-fit').click();answerAll(fixture,'regression');
 assert.match(fixture.$('progress-state').textContent,/Lesson complete/);
 fixture.$('clear-progress').click();
 assert.equal(fixture.$('step-lab').className,'');
 assert.equal(fixture.$('step-quiz').className,'');
 assert.equal(fixture.$('quiz-score').textContent,'');
 assert.ok(fixture.document.querySelectorAll('[data-quiz]').every(b=>b.getAttribute('aria-pressed')==='false'));
 answerAll(fixture,'regression');
 assert.equal(fixture.storage['cwi-ml-v7'],undefined);
 assert.match(fixture.$('progress-state').textContent,/Now try the experiment/);
});

test('saving a lesson merges progress added by another already-open lesson tab',()=>{
 const first=load('lesson','?lesson=framing'),second=load('lesson','?lesson=data');
 first.document.querySelectorAll('[data-task]')[0].click();answerAll(first,'framing');
 // The second tab opened before the first completed; its storage now sees the other tab's write.
 second.storage['cwi-ml-v7']=first.storage['cwi-ml-v7'];
 second.document.querySelectorAll('[data-task]')[0].click();answerAll(second,'data');
 assert.deepEqual(JSON.parse(second.storage['cwi-ml-v7']),['framing','data']);
});

test('the project brief downloads learner text without inserting it into the page',async()=>{
 const fixture=load('lesson','?lesson=framing');
 input(fixture,'mlx-decision','<script>example</script> Plan meals');
 fixture.$('mlx-download').click();
 assert.equal(fixture.downloads[0].filename,'my-ml-project-brief.md');
 assert.match(await fixture.blobs[0].text(),/Plan meals/);
 assert.equal(fixture.$('lesson-extensions').querySelectorAll('script').length,0);
 assert.match(fixture.$('mlx-brief-status').textContent,/downloaded/i);
});

test('data inspection reacts to unusual and missing values, with observed-value summaries',()=>{
 const fixture=load('lesson','?lesson=data');
 const metrics=()=>fixture.$('mlx-inspection').querySelectorAll('dd').map(x=>x.textContent);
 const initial=metrics();
 fixture.$('mlx-outlier').checked=true;fixture.$('mlx-outlier').fire('change');
 assert.ok(Number(metrics()[0])>Number(initial[0]));
 assert.ok(Number(metrics()[0])-Number(initial[0])>Number(metrics()[1])-Number(initial[1]));
 fixture.$('mlx-missing').checked=true;fixture.$('mlx-missing').fire('change');
 assert.equal(metrics()[2],'2 / 14');
 assert.match(fixture.$('mlx-rows').textContent,/Missing/);
 assert.doesNotMatch(fixture.$('mlx-inspection').innerHTML,/NaN|Infinity/);
});

test('weekday-only sampling exposes selection bias and a meaningful new activity completes progress',()=>{
 const fixture=load('lesson','?lesson=data');
 answerAll(fixture,'data');
 assert.match(fixture.$('progress-state').textContent,/try the experiment/);
 input(fixture,'mlx-sampling','weekdays','change');
 input(fixture,'mlx-sample-size',70);
 assert.match(fixture.$('mlx-sample-results').textContent,/0 of 70 draws are weekends/);
 const delta=fixture.$('mlx-sample-results').querySelectorAll('dd')[2].textContent;
 assert.ok(Number(delta)<-5);
 assert.match(fixture.$('progress-state').textContent,/Lesson complete/);
});

test('larger repeated samples narrow the displayed sample-mean distribution',()=>{
 const fixture=load('lesson','?lesson=regression');
 const width=()=>{const m=fixture.$('mlx-repeat-results').querySelectorAll('dd');return Number(m[2].textContent)-Number(m[1].textContent);};
 const initial=width();
 input(fixture,'mlx-repeat-size',70);
 assert.ok(width()<initial);
 assert.match(fixture.$('lesson-extensions').textContent,/how much an average can move from one sample to the next/);
 assert.match(fixture.$('lesson-extensions').textContent,/doesn’t tell you how many meals tomorrow will need/);
 assert.equal(fixture.$('mlx-residuals').querySelectorAll('table').length,1);
});

test('rare outcomes expose the accuracy trap with independently calculated counts',()=>{
 const fixture=load('lesson','?lesson=classification');
 input(fixture,'mlx-prevalence',1);
 assert.deepEqual(fixture.$('mlx-prevalence-results').querySelectorAll('dd').map(x=>x.textContent),['7.5%','89.9%','99.0%']);
 assert.match(fixture.$('mlx-prevalence-results').textContent,/8.0 of 107.0 flagged/);
 input(fixture,'mlx-prevalence',50);
 assert.equal(fixture.$('mlx-prevalence-results').querySelectorAll('dd')[0].textContent,'88.9%');
});

test('training size and regularisation change fitted errors without nonfinite output',()=>{
 const fixture=load('lesson','?lesson=overfitting');
 input(fixture,'mlx-fit-degree',9);
 const errors=()=>fixture.$('mlx-learning-results').querySelectorAll('dd').map(x=>x.textContent);
 const first=errors();
 input(fixture,'mlx-regularisation',.001,'change');
 assert.notDeepEqual(errors(),first);
 input(fixture,'mlx-fit-size',24);
 assert.equal(fixture.$('mlx-fit-size-value').textContent,'24');
 assert.equal(errors()[2],'12');
 assert.doesNotMatch(fixture.$('mlx-learning-results').innerHTML,/NaN|Infinity/);
});

test('shared-fold and final-comparison controls stay in sync and freeze before revealing test data',()=>{
 const fixture=load('lesson','?lesson=comparison');
 assert.equal(fixture.$('mlx-cv-results').querySelectorAll('tbody')[0].querySelectorAll('tr').length,4);
 input(fixture,'mlx-cv-k',7);
 assert.equal(fixture.$('neighbours').value,'7');
 assert.equal(fixture.$('neighbours-value').textContent,'7');
 input(fixture,'neighbours',5);
 assert.equal(fixture.$('mlx-cv-k').value,'5');
 fixture.$('lock-model').click();
 assert.equal(fixture.$('mlx-cv-k').disabled,true);
 assert.match(fixture.$('mlx-cv-lock-note').textContent,/frozen/);
 const locked=fixture.$('mlx-cv-results').innerHTML;
 fixture.$('mlx-cv-k').value=1;fixture.$('mlx-cv-k').fire('input',true);
 assert.equal(fixture.$('mlx-cv-results').innerHTML,locked);
 fixture.$('reveal-test').click();
 assert.match(fixture.$('lab-note').textContent,/Final test MAE/);
});

test('extension charts have unique titles and every activity names its reference authors',()=>{
 for(const id of ['framing','data','regression','classification','overfitting','comparison']){
  const fixture=load('lesson','?lesson='+id),root=fixture.$('lesson-extensions');
  assert.ok(root.children.length);
  assert.match(root.textContent,/Conceptual reference/);
  const charts=root.querySelectorAll('svg'),ids=charts.map(c=>c.getAttribute('aria-labelledby'));
  assert.equal(new Set(ids).size,ids.length);
  charts.forEach(chart=>assert.ok(chart.querySelectorAll('title')[0].textContent.length>15));
 }
});

test('project worksheet exports all six sections locally and escapes typed HTML',async()=>{
 const fixture=load('project');
 assert.match(fixture.$('project-status').textContent,/0 of 6/);
 input(fixture,'project-problem','<script>unsafe()</script> Plan tomorrow');
 input(fixture,'project-data','Original fictional days');
 assert.match(fixture.$('project-status').textContent,/2 of 6/);
 fixture.$('project-download').click();
 assert.equal(fixture.downloads[0].filename,'my-kitchen-ml-project.md');
 const text=await fixture.blobs[0].text();
 assert.match(text,/&lt;script&gt;/);
 assert.doesNotMatch(text,/<script>/);
 for(const heading of ['The decision','The evidence','The split','The comparison','The result','The limits and monitoring plan'])assert.ok(text.includes(heading));
 assert.deepEqual(fixture.revoked,[fixture.downloads[0].url]);
 assert.equal(fixture.document.querySelectorAll('textarea').length,6);
});

test('the notebook is an honestly unexecuted original starter with separate chronological data',()=>{
 const notebook=JSON.parse(fs.readFileSync(path.join(directory,'notebooks','kitchen-project.ipynb'),'utf8'));
 assert.equal(notebook.nbformat,4);
 const code=notebook.cells.filter(c=>c.cell_type==='code');
 assert.ok(code.length>=6);
 assert.ok(code.every(c=>c.execution_count===null&&c.outputs.length===0));
 const combined=notebook.cells.map(c=>c.source.join('')).join('\n');
 assert.match(combined,/180/);
 assert.match(combined,/ColumnTransformer/);
 assert.match(combined,/median/);
 assert.match(combined,/final.test/i);
 assert.doesNotMatch(combined,/read_csv\(['"]https:|fetch_openml|urlretrieve|requests\.get/);
});

test('lesson 2 explains filling gaps and timing before asking about them, and the audit includes past outcomes',()=>{
 const fixture=load('lesson','?lesson=data');
 const text=fixture.$('lesson-root').textContent;
 assert.match(text,/Filling the gaps/);
 assert.match(text,/Past outcomes are allowed/);
 assert.doesNotMatch(fixture.$('checkpoint').textContent+fixture.$('idea').textContent,/imputer/i);
 assert.match(text,/previous 7 days/);
 assert.equal(fixture.$('lab-body').querySelectorAll('.ml-task').length,5);
 assert.match(text,/on the day being forecast/);
});

test('lesson 2 explains the three piles of days first, and lessons 3 and 5 link back to it',()=>{
 const d=load('lesson','?lesson=data');
 assert.ok(d.$('three-piles'));
 assert.match(d.$('idea').textContent,/practice questions[\s\S]*mock exam[\s\S]*real exam/);
 for(const id of ['regression','overfitting']){
  const f=load('lesson','?lesson='+id);
  assert.ok(f.$('idea').querySelectorAll('a').some(a=>a.getAttribute('href')==='lesson.html?lesson=data#three-piles'));
 }
});
