/*
 * Code With Impact: shared glossary for Learn AI and Learn ML.
 * One list of plain-English definitions. It powers:
 *  - selected hover / tap / keyboard definitions on lesson pages, and
 *  - the glossary page (glossary.html).
 * To change a definition, edit it here once; it updates everywhere.
 */
(function () {
  'use strict';
  // Aliases resolve authored data-term markers. Ordinary lesson text is never scanned.
  const TERMS = [
    { term: 'Artificial intelligence (AI)', match: ['artificial intelligence'], def: 'Getting computers to do tasks that usually need human judgement, such as understanding language, recognising images or making predictions.' },
    { term: 'Machine learning', match: ['machine learning'], def: 'A way of building AI where the computer learns patterns from examples, instead of a person writing every rule.' },
    { term: 'Model', match: ['model', 'models'], def: 'A mathematical system whose patterns or settings are learned from data. Depending on the task, it can predict outcomes, find groups or generate content.' },
    { term: 'Training data', match: ['training data', 'training days', 'training examples', 'training set'], def: 'The examples a model learns from: its practice questions.' },
    { term: 'Validation data', match: ['validation data', 'validation days', 'validation examples', 'validation set'], def: 'Examples kept aside to compare models and choose settings: the mock exam.' },
    { term: 'Test data', match: ['test data', 'test days', 'test set', 'final test'], def: 'Examples used once, at the very end, to get an honest score: the real exam.' },
    { term: 'Feature', match: ['features', 'feature'], def: 'A piece of information a model uses to make a prediction, such as the number of expected visitors or a word in a message.' },
    { term: 'Label', match: ['labelled', 'labels'], def: 'The right answer attached to an example, such as “urgent” or “can wait”, so a model can learn from it.' },
    { term: 'Generative AI', match: ['generative ai'], def: 'AI that creates content, such as text, images or audio, using patterns learned from examples.' },
    { term: 'Large language model (LLM)', match: ['large language model', 'language model', 'llm', 'llms'], def: 'An AI model trained on huge amounts of text to predict what comes next. ChatGPT, Claude and Gemini are built on them.' },
    { term: 'Token', match: ['tokens', 'token'], def: 'A unit a language model uses to represent text, such as a word, part of a word or punctuation. Chat models usually generate their answers token by token.' },
    { term: 'Vector', match: ['vectors', 'vector'], def: 'A list of numbers. Text is turned into vectors so a computer can work with it.' },
    { term: 'Embedding', match: ['embeddings', 'embedding'], def: 'A learned numerical representation of text, images or other data. For text search, related passages are often close together in this numerical space.' },
    { term: 'Neural network', match: ['neural network', 'neural networks'], def: 'A system of many simple calculating units, arranged in layers, whose settings are learned from examples.' },
    { term: 'Transformer', match: ['transformer'], def: 'The neural-network design used by today’s language models. It uses attention to work out how the words in a text relate to each other.' },
    { term: 'Attention', match: ['attention'], def: 'A calculation that combines information from different token positions, giving some positions more weight. In the chat-model example here, each position can use itself and earlier tokens.' },
    { term: 'Parameters', match: ['parameters'], def: 'The internal numbers a model adjusts while it learns. Large language models have billions of them.' },
    { term: 'Temperature', match: ['temperature'], def: 'A setting that controls how adventurous a language model is when picking the next word. Low is predictable; high is more varied.' },
    { term: 'Prompt', match: ['prompt'], def: 'The instructions and information you give an AI model.' },
    { term: 'Context window', match: ['context window'], def: 'How much text a language model can “see” at once: your instructions, documents and the conversation so far.' },
    { term: 'Semantic search', match: ['semantic search', 'meaning search'], def: 'Searching by meaning rather than exact words, so “caring for a relative” can find “support for carers”.' },
    { term: 'Cosine similarity', match: ['cosine similarity'], def: 'A score comparing the directions of two lists of numbers, ignoring their lengths. With text embeddings, a higher score can suggest related content; it does not prove the content is correct or answers the question.' },
    { term: 'RAG (retrieval-augmented generation)', match: ['retrieval-augmented generation', 'rag'], def: 'Finding the relevant passages in your own documents first, then giving them to the model so it answers from them.' },
    { term: 'Chunk', match: ['chunks', 'chunk'], def: 'A short passage cut from a longer document, so the most relevant parts can be found and given to a model.' },
    { term: 'Top-k', match: ['top-k'], def: 'How many of the best-matching passages (or neighbours) to use.' },
    { term: 'Grounded', match: ['grounded'], def: 'An answer based on specific sources you supplied, which it can cite, rather than the model’s general memory.' },
    { term: 'AI agent', match: ['ai agent', 'agents', 'agent'], def: 'A language model working in a loop: it decides what to do next, asks for tools to be used, reads the results and continues.' },
    { term: 'Tool call', match: ['tool call', 'tool calls'], def: 'A structured request from an AI agent for your program to do something, such as look up a rota. Your program decides whether to run it.' },
    { term: 'Prompt injection', match: ['prompt injection', 'prompt-injection'], def: 'An attempt to make an AI follow untrusted instructions instead of its intended task. The instructions may arrive in a user message or in content such as a document, email or web page.' },
    { term: 'Guardrail', match: ['guardrails', 'guardrail'], def: 'A check or limit around an AI system, such as blocking personal data or requiring approval before sending.' },
    { term: 'Rubric', match: ['rubric'], def: 'A short written list of what a good answer looks like, used to grade answers consistently.' },
    { term: 'UK GDPR', match: ['uk gdpr'], def: 'The main UK rules governing how organisations use personal data and protect people’s information rights.' },
    { term: 'DPIA (data protection impact assessment)', match: ['data protection impact assessment', 'dpia'], def: 'A process for checking how a project’s use of personal data could harm people or affect their rights, and how to reduce those risks. It is required before processing likely to create high risks.' },
    { term: 'Special category data', match: ['special category data'], def: 'The most sensitive personal information under data protection law, such as health details.' },
    { term: 'Data processing agreement', match: ['data processing agreement'], def: 'A contract in which a supplier promises to protect your data and use it only as you instruct.' },
    { term: 'Baseline', match: ['baseline'], def: 'A simple comparison that any new approach must beat, such as “predict the recent average” or “how long it takes today”.' },
    { term: 'Drift', match: ['drift'], def: 'A change over time in the data a system receives, or in the patterns linking inputs to outcomes. It can happen gradually or suddenly and may affect performance.' },
    { term: 'Data leakage', match: ['data leakage', 'leakage'], def: 'When a model uses information it wouldn’t really have at the time of the prediction, so it looks better than it is.' },
    { term: 'Imputation', match: ['imputation'], def: 'Filling in missing values, for example with a typical value from the training data.' },
    { term: 'Median', match: ['median'], def: 'The middle value when numbers are put in order. Unlike the average, it isn’t pulled up or down by a few unusual values.' },
    { term: 'Regression', match: ['regression'], def: 'Predicting a number, such as how many meals will be needed.' },
    { term: 'Classification', match: ['classification'], def: 'Predicting a category, such as “busy day” or “quiet day”.' },
    { term: 'Linear regression', match: ['linear regression'], def: 'Predicting a number with a straight line: a starting value plus a fixed amount for each unit of input.' },
    { term: 'Logistic regression', match: ['logistic regression'], def: 'Predicting the chance of a yes/no outcome, using an S-shaped curve that keeps the answer between 0 and 1.' },
    { term: 'Residual', match: ['residuals', 'residual'], def: 'The gap between the real value and the prediction for one example.' },
    { term: 'MAE (mean absolute error)', match: ['mean absolute error', 'mae'], def: 'The average size of a model’s mistakes, ignoring whether they were too high or too low.' },
    { term: 'Threshold', match: ['threshold'], def: 'The cut-off that turns a score into a decision, such as “flag the day if the chance of being busy is 50% or more”.' },
    { term: 'Precision', match: ['precision'], def: 'Of the cases flagged, how many really were positive. High precision means few false alarms.' },
    { term: 'Recall', match: ['recall'], def: 'Of the cases that really were positive, how many were flagged. High recall means few misses.' },
    { term: 'Overfitting', match: ['overfitting'], def: 'When a model memorises the training examples, including their noise, and does worse on new ones.' },
    { term: 'Underfitting', match: ['underfitting'], def: 'When a model is too simple to capture the real pattern.' },
    { term: 'Regularisation', match: ['regularisation'], def: 'Limiting how complicated a model can become, so it is less likely to memorise noise.' },
    { term: 'Fold', match: ['folds', 'fold'], def: 'One of the groups data is split into, so a model can be tested in several rounds on different days.' },
    { term: 'Polynomial', match: ['polynomial'], def: 'A curve built from powers of the input (squared, cubed and so on). Higher degrees can bend more.' },
    { term: 'k-nearest neighbours', match: ['nearest neighbours', 'nearest-neighbour', 'k-nn'], def: 'Predicting from the k most similar training examples: combine their numbers for regression, or their categories for classification.' },
    { term: 'Decision tree', match: ['decision tree', 'decision trees'], def: 'A flowchart of yes/no questions that leads to a prediction.' },
    { term: 'Random forest', match: ['random forest'], def: 'Many decision trees, each trained on a slightly different sample of the data, with their predictions averaged.' },
    { term: 'Gradient boosting', match: ['gradient boosting', 'boosting'], def: 'Building small decision trees one after another, each correcting the mistakes of the ones before.' },
    { term: 'Clustering', match: ['clustering'], def: 'Finding groups of examples that are similar according to the features and method you choose. The groups do not come with supplied labels.' },
    { term: 'k-means clustering', match: ['k-means'], def: 'One clustering method that assigns examples to k centre points, then updates those centres.' },
    { term: 'Naive Bayes', match: ['naive bayes'], def: 'A way to classify an example by combining evidence from its features. It assumes the features are independent within each category, even when that is only an approximation.' },
    { term: 'Sampling bias', match: ['selection bias', 'sampling bias', 'biased sample'], def: 'When the examples collected leave out or under-represent some situations, so conclusions don’t apply to them.' }
  ];

  const slug = value => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const byName = new Map();
  TERMS.forEach((term, index) => {
    term.id = slug(term.term);
    [term.id, ...term.match].forEach(alias => byName.set(slug(alias), index));
  });
  function getTerm(name) { return TERMS[byName.get(slug(name || ''))] || null; }

  // ---------- Glossary page ----------
  function renderPage(root) {
    const sorted = TERMS.slice().sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
    root.innerHTML = '<label class="gl-search">Find a term <input type="search" id="gl-filter" placeholder="e.g. token, overfitting"></label>' +
      '<dl class="gl-list">' + sorted.map(t => `<div class="gl-entry" id="${t.id}"><dt>${t.term}</dt><dd>${t.def}</dd></div>`).join('') + '</dl>' +
      '<p class="gl-none" hidden>No matching terms. Try a shorter word, or <a href="mailto:engagement@codewithimpact.com?subject=Glossary%20suggestion">suggest one</a>.</p>';
    const input = root.querySelector('#gl-filter'), entries = [...root.querySelectorAll('.gl-entry')], none = root.querySelector('.gl-none');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase(); let shown = 0;
      entries.forEach(e => { const hit = !q || e.textContent.toLowerCase().includes(q); e.hidden = !hit; if (hit) shown++; });
      none.hidden = shown > 0;
    });
  }

  // ---------- Authored hover / tap / keyboard definitions ----------
  const ROOTS = '.lesson-content,#lesson-root,#methods-root';
  let tip, current = null, pinned = false, uid = 0, closeTimer = null;
  let hoveredTrigger = null, hoveredTip = false, wired = false;

  function cancelClose() {
    if (closeTimer !== null) { clearTimeout(closeTimer); closeTimer = null; }
  }
  function scheduleClose() {
    cancelClose();
    // Allow the pointer to cross the small positioning gap into the definition.
    closeTimer = setTimeout(() => {
      closeTimer = null;
      if (!pinned && !hoveredTip && hoveredTrigger !== current && document.activeElement !== current) hide();
    }, 240);
  }
  function resetTrigger(btn) {
    btn.removeAttribute('aria-describedby');
    btn.setAttribute('aria-expanded', 'false');
  }

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'gl-tip'; tip.id = 'gl-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  }
  function show(btn) {
    const t = TERMS[+btn.dataset.gl]; ensureTip();
    if (!t) return;
    cancelClose();
    if (current && current !== btn) { resetTrigger(current); pinned = false; }
    tip.innerHTML = `<b>${t.term}</b><span>${t.def}</span>`;
    tip.hidden = false; current = btn;
    btn.setAttribute('aria-describedby', 'gl-tip'); btn.setAttribute('aria-expanded', 'true');
    const r = btn.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    tip.style.width = w + 'px';
    let left = r.left + window.scrollX + r.width / 2 - w / 2;
    left = Math.max(window.scrollX + 12, Math.min(left, window.scrollX + window.innerWidth - w - 12));
    tip.style.left = left + 'px';
    const below = r.bottom + window.scrollY + 8, h = tip.offsetHeight;
    const above = r.top + window.scrollY - h - 8;
    tip.style.top = (r.bottom + h + 16 > window.innerHeight && above > window.scrollY ? above : below) + 'px';
  }
  function hide() {
    cancelClose();
    if (tip) tip.hidden = true;
    pinned = false; hoveredTip = false;
    if (current) resetTrigger(current);
    current = null;
  }

  function annotate() {
    const roots = [...document.querySelectorAll(ROOTS)];
    const used = new Set([...document.querySelectorAll('.gl-term')].map(b => +b.dataset.gl));
    roots.forEach(root => {
      root.querySelectorAll('[data-term]').forEach(marker => {
        if (marker.classList.contains('gl-term')) return;
        const index = byName.get(slug(marker.dataset.term || ''));
        if (index === undefined || used.has(index) || !marker.textContent.trim()) return;
        // An authored marker must not create an interactive control inside another.
        if (marker.closest('a,button,input,select,textarea,label,summary,[contenteditable="true"]')) return;
        used.add(index);
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'gl-term'; button.id = 'gl-t' + (++uid);
        button.dataset.gl = index; button.dataset.term = TERMS[index].id;
        button.setAttribute('aria-expanded', 'false');
        button.textContent = marker.textContent;
        marker.replaceWith(button);
      });
    });
    addGlossaryLink();
  }

  function wire() {
    if (wired) return;
    wired = true;
    document.addEventListener('mouseover', e => {
      const button = e.target.closest && e.target.closest('.gl-term');
      if (button) { hoveredTrigger = button; cancelClose(); if (!pinned) show(button); }
      if (e.target.closest && e.target.closest('.gl-tip')) { hoveredTip = true; cancelClose(); }
    });
    document.addEventListener('mouseout', e => {
      const button = e.target.closest && e.target.closest('.gl-term');
      if (button && !(e.relatedTarget && button.contains(e.relatedTarget))) { hoveredTrigger = null; scheduleClose(); }
      if (tip && tip.contains(e.target) && !(e.relatedTarget && tip.contains(e.relatedTarget))) { hoveredTip = false; scheduleClose(); }
    });
    document.addEventListener('focusin', e => {
      const button = e.target.closest && e.target.closest('.gl-term');
      if (button) show(button);
    });
    document.addEventListener('focusout', e => {
      if (current && current.contains(e.target)) { pinned = false; scheduleClose(); }
    });
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('.gl-term');
      if (b) { e.preventDefault(); if (current === b && pinned) hide(); else { show(b); pinned = true; } return; }
      if (!(e.target.closest && e.target.closest('.gl-tip'))) hide();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    window.addEventListener('resize', hide);
  }

  function addGlossaryLink() {
    const host = document.querySelector('.learning-nav-resources') || document.querySelector('.ml-sidebar') || document.querySelector('.toc');
    if (!host || host.querySelector('.gl-link')) return;
    const script = [...document.querySelectorAll('script[src]')].find(s => /(?:^|\/)glossary\.js(?:[?#]|$)/.test(s.getAttribute('src')));
    const href = script ? script.getAttribute('src').replace(/glossary\.js(?:[?#].*)?$/, 'glossary.html') : '../glossary.html';
    const a = document.createElement('a'); a.href = href; a.textContent = 'Glossary →'; a.className = 'gl-link';
    host.appendChild(a);
  }

  window.CWIGlossary = { terms: TERMS, getTerm, annotate };
  function start() {
    const page = document.getElementById('glossary-root');
    if (page) { renderPage(page); return; }
    wire();
    // Learn ML lessons are drawn by script; wait until their authored markers exist.
    setTimeout(annotate, 60);
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
