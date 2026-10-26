(function () {
  'use strict';

  const sections = [
    ['problem', '1. The decision'],
    ['data', '2. The evidence'],
    ['split', '3. The split'],
    ['baseline', '4. The comparison'],
    ['result', '5. The result'],
    ['limits', '6. The limits and monitoring plan']
  ];

  function escapeMarkdown(value) {
    return String(value || '').replace(/\r\n?/g, '\n')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/([\\`*_{}\[\]()#+.!|~=-])/g, '\\$1');
  }

  function buildProjectMarkdown(answers) {
    const content = sections.map(function (section) {
      const answer = String(answers[section[0]] || '').trim();
      return '## ' + section[1] + '\n\n' + (answer ? escapeMarkdown(answer) : '_Not recorded yet._');
    });
    return '# My community-kitchen ML project\n\n' +
      'A learner-authored draft from the original Code With Impact Learn ML worksheet.\n' +
      'Scores need a named dataset; synthetic examples do not establish real-world readiness.\n\n' +
      content.join('\n\n') + '\n\n' +
      '## Learning references\n\n' +
      'Conceptual workflow: Aurélien Géron, Hands-On Machine Learning.\n' +
      'Sampling and evaluation: Peter Bruce, Andrew Bruce and Peter Gedeck, Practical Statistics for Data Scientists.\n' +
      'Original activity, implementation and synthetic data: Code With Impact.\n';
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildProjectMarkdown: buildProjectMarkdown, escapeMarkdown: escapeMarkdown };
  }
  if (typeof document === 'undefined') return;

  const form = document.getElementById('project-form');
  const status = document.getElementById('project-status');
  const download = document.getElementById('project-download');
  if (!form || !status || !download) return;

  function readAnswers() {
    const answers = {};
    sections.forEach(function (section) {
      answers[section[0]] = form.elements.namedItem(section[0]).value;
    });
    return answers;
  }

  function updateStatus() {
    const answers = readAnswers();
    const started = sections.filter(function (section) { return answers[section[0]].trim().length > 0; }).length;
    status.textContent = started + ' of 6 sections started. Download before leaving this page.';
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); });
  form.addEventListener('input', updateStatus);
  download.addEventListener('click', function () {
    const blob = new Blob([buildProjectMarkdown(readAnswers())], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-kitchen-ml-project.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = 'Download requested. Your answers stay on this page until you leave or refresh.';
  });
}());
