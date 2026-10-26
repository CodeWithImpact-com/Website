/* Shared lesson navigation. Moves existing nodes so lab events and progress IDs survive. */
'use strict';
(() => {
  const desktop = window.matchMedia ? window.matchMedia('(min-width: 901px)') : null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function disclosure(label, className, responsive) {
    const details = element('details', 'learning-nav-details ' + className);
    details.append(element('summary', 'learning-nav-summary', label));
    if (responsive) {
      const resize = () => { details.open = desktop ? desktop.matches : window.innerWidth > 900; };
      resize();
      if (desktop && desktop.addEventListener) desktop.addEventListener('change', resize);
      else if (desktop && desktop.addListener) desktop.addListener(resize);
    }
    return details;
  }

  // The Learn AI course, for the "Course contents" list (same as learn/learning-path.js).
  const AI_LESSONS = [
    ['ai-made-simple.html', 'AI Made Simple'], ['inside-an-llm.html', 'Inside an LLM'],
    ['prompting-and-context.html', 'Prompting & Context'], ['embeddings-and-search.html', 'Embeddings & Search'],
    ['build-a-rag-system.html', 'Build a RAG System'], ['ai-agents.html', 'AI Agents'],
    ['evaluation-and-safety.html', 'Evaluation & Safety'], ['ai-in-your-organisation.html', 'AI in Your Organisation'],
    ['choosing-ai-tools.html', 'Choosing AI Tools'], ['ai-in-your-processes.html', 'AI in Your Processes'],
    ['consistent-ai.html', 'Consistent AI Across Teams'], ['validating-ai-in-use.html', 'Validating AI in Use']
  ];

  function link(href, text) {
    const a = element('a', '', text);
    a.setAttribute('href', href);
    return a;
  }

  function enhanceAI(shell) {
    const toc = shell.querySelector('.toc');
    const content = shell.querySelector('.lesson-content');
    if (!toc || !content || toc.getAttribute('data-learning-layout')) return;
    toc.setAttribute('data-learning-layout', 'ready');
    toc.setAttribute('aria-label', 'Lesson navigation');
    // Keep reading and keyboard order the same at every screen size.
    shell.insertBefore(toc, content);

    const quiz = content.querySelector('#quiz');
    const deeper = content.querySelector('#deeper');
    if (quiz && deeper && quiz.parentElement === deeper.parentElement) quiz.after(deeper);

    const heading = toc.querySelector('strong');
    if (heading) heading.remove();
    const current = disclosure('In this lesson', 'learning-nav-current', true);
    const links = element('div', 'learning-nav-links');
    const resources = element('div', 'learning-nav-resources');
    Array.from(toc.querySelectorAll('a')).forEach(link => {
      (link.getAttribute('href')?.startsWith('#') ? links : resources).append(link);
    });
    const quizLink = links.querySelector('a[href="#quiz"]');
    const deeperLink = links.querySelector('a[href="#deeper"]');
    if (quizLink && deeperLink) quizLink.after(deeperLink);
    current.append(links);
    const progress = toc.querySelector('.toc-progress');
    if (progress) current.append(progress);

    // Course contents, as in Learn ML.
    const course = disclosure('Course contents', 'learning-nav-course', false);
    const list = element('ol');
    const path = (typeof location !== 'undefined' && location.pathname) || '';
    const here = (path.split('/').pop() || '').toLowerCase();
    AI_LESSONS.forEach(([href, title], i) => {
      const li = element('li');
      const a = link(href, String(i + 1).padStart(2, '0') + ' · ' + title);
      if (href === here) a.setAttribute('aria-current', 'page');
      li.append(a);
      list.append(li);
    });
    course.append(list);

    // The same links at the bottom as Learn ML (the glossary link is added by glossary.js).
    resources.append(link('resources.html', 'Learning materials →'), link('credits.html', 'Sources & credits →'), link('../learn-ml/index.html', 'Learn ML →'));
    toc.append(current, course, resources);
  }

  // Learn ML: name the in-page links after the lesson's own headings, like Learn AI.
  function nameMLLinks(sidebar) {
    const shorten = text => text.replace(/\s+/g, ' ').trim();
    sidebar.querySelectorAll('.learning-nav-links a[href^="#"]').forEach(a => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      const id = target.id;
      if (id === 'checkpoint' || id === 'technical' || id === 'how-it-works') return;
      const heading = target.querySelector('h2, h3');
      if (heading && heading.textContent.trim()) a.textContent = shorten(heading.textContent);
    });
  }

  function enhanceML(shell) {
    const sidebar = shell.querySelector('.ml-sidebar');
    if (!sidebar || sidebar.getAttribute('data-learning-layout')) return;
    sidebar.setAttribute('data-learning-layout', 'ready');
    const heading = Array.from(sidebar.children).find(child => child.tagName.toLowerCase() === 'p');
    if (heading) heading.remove();
    const current = disclosure('In this lesson', 'learning-nav-current', true);
    const course = disclosure('Course contents', 'learning-nav-course', false);
    const syllabus = sidebar.querySelector('ol');
    if (syllabus) course.append(syllabus);
    const resources = element('div', 'ml-in-page learning-nav-resources');
    const links = element('div', 'learning-nav-links');
    Array.from(sidebar.querySelectorAll('.ml-in-page')).forEach(group => {
      Array.from(group.querySelectorAll('a')).forEach(link => {
        (link.getAttribute('href')?.startsWith('#') ? links : resources).append(link);
      });
      group.remove();
    });
    current.append(links);
    // This is the same live progress component, now beside the current-lesson links.
    const progress = shell.querySelector('#lesson-progress');
    if (progress) current.append(progress);
    sidebar.append(current);
    if (syllabus) sidebar.append(course);
    sidebar.append(resources);
    nameMLLinks(sidebar);
    // Practice activities are drawn by another script; rename again once the page has loaded.
    if (typeof window.addEventListener === 'function') window.addEventListener('load', () => setTimeout(() => nameMLLinks(sidebar), 80));
  }

  function enhance(root = document) {
    root.querySelectorAll('.lesson-shell').forEach(enhanceAI);
    root.querySelectorAll('.ml-lesson-shell').forEach(enhanceML);
  }

  window.CWILearningLayout = { enhance };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => enhance());
  else enhance();
})();
