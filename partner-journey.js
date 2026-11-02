/* Work With Us page: "What we can help with" tabs and the six-step partner journey. */
'use strict';
(() => {
  const SKILLS = [
    {
      title: 'Show your data clearly',
      text: 'We turn spreadsheets and reports into simple dashboards your team can use every day.',
      items: ['Interactive dashboards', 'Charts that show your impact', 'Clear measures of success', 'Reports ready for decisions'],
      exTitle: 'MQ Mental Health Research',
      exText: 'A dashboard that shows the impact of the research MQ funds. Our first partner project.',
      exLink: ['Read MQ\'s endorsement ↗', 'https://lnkd.in/p/eQ6-htuC'],
      status: 'Partner project · In progress'
    },
    {
      title: 'Use AI to save time, safely',
      text: 'We find where AI can help your team, like searching documents or papers, and a person always checks the results.',
      items: ['Smart search for papers and documents', 'AI prototypes you can try', 'Simple automations', 'Checks on how well the AI works'],
      exTitle: 'ALS Research Finder',
      exText: 'Helps researchers find ALS papers and public datasets in one place.',
      status: 'Our project · Prototype'
    },
    {
      title: 'Make sense of research',
      text: 'We gather scattered studies, compare them and explain what they say in plain words.',
      items: ['Finding the right studies', 'Comparing results fairly', 'Short, clear summaries', 'Help with meta-analysis'],
      exTitle: 'Heart research data (PAD)',
      exText: 'Organising published studies on blood markers in peripheral artery disease, with a clinician.',
      status: 'Research support · With a doctor'
    },
    {
      title: 'Find patterns you can trust',
      text: 'Many of our volunteers build and test models for banks. We use the same care to see if a model can answer your question, and how far to trust it.',
      items: ['Exploring your data', 'Small prediction pilots', 'Testing models fairly', 'Work others can repeat'],
      exTitle: 'ALS Predict (student project)',
      exText: 'Master\'s students, mentored by our volunteers, test ways to predict how ALS progresses using public data.',
      status: 'University project · Starting'
    },
    {
      title: 'Get your data ready',
      text: 'Often the first job is tidying up. We help you see what data you have and make it consistent and safe to use.',
      items: ['Cleaning messy data', 'Quality checks', 'A simple guide to your data', 'Safe ways to store and share it'],
      exTitle: 'A common first step',
      exText: 'When data is spread across many files, tidying it up comes before any dashboard or model.',
      status: 'Typical starting point'
    }
  ];

  const STEPS = [
    {
      where: 'Step 1 of 6 · A first chat', ico: '💬',
      title: 'Tell us the problem',
      what: 'Tell us, in your own words, what is slowing your team down. No technical brief needed.',
      you: 'The problem, and why it matters to you.',
      we: 'Good questions and an honest first view.',
      get: 'A shared view of the problem, and whether we are a good fit.',
      voice: 'Tell us if we have understood the problem right.'
    },
    {
      where: 'Step 2 of 6 · Looking closer', ico: '🔍',
      title: 'Check it\'s possible',
      what: 'We look at the data you have, who will use the result and any privacy questions. We also check we have volunteers with the right skills.',
      you: 'A contact person and a look at your data.',
      we: 'Options, risks and a realistic plan.',
      get: 'A clear "yes", "not yet" or "no", with reasons.',
      voice: 'Say if the plan feels right for your team.'
    },
    {
      where: 'Step 3 of 6 · Planning', ico: '📝',
      title: 'Agree a small first project',
      what: 'We agree one small, useful project: the goal, who does what, key dates and what success looks like.',
      you: 'Your priorities, and who needs to say yes.',
      we: 'A short project plan and a volunteer team.',
      get: 'A one-page plan we both agree on.',
      voice: 'Change anything that doesn\'t fit before we start.'
    },
    {
      where: 'Step 4 of 6 · Building', ico: '🛠️',
      title: 'Build it together',
      what: 'Our volunteers build the tool or analysis in small steps and show you progress regularly.',
      you: 'Your expert knowledge and quick answers.',
      we: 'The technical work and regular updates.',
      get: 'A working version you can try.',
      voice: 'Short check-ins, so you can steer the work as we go.'
    },
    {
      where: 'Step 5 of 6 · Handover', ico: '🤝',
      title: 'Hand it over',
      what: 'We test it with your team, explain what it can and can\'t do, and leave simple guides so you can keep using it.',
      you: 'Testing with the people who will use it.',
      we: 'Fixes, guides and a walkthrough.',
      get: 'A tool you own and know how to use.',
      voice: 'Tell us what is missing before we finish.'
    },
    {
      where: 'Step 6 of 6 · Review', ico: '🌱',
      title: 'Look back together',
      what: 'A few weeks later we look at what changed, what worked and what we would do differently. Then we decide on next steps together.',
      you: 'Your honest view, and any results you can share.',
      we: 'A short summary of what we learned.',
      get: 'A clear picture of the impact, and what could come next.',
      voice: 'A short feedback form helps us improve for the next partner.'
    }
  ];

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => { $(id).textContent = value; };

  // Accessible tabs: click, arrow keys, Home/End. Returns a select(index) function.
  function makeTabs(tabs, panel, onSelect) {
    function select(i, focus) {
      const n = tabs.length;
      i = (i + n) % n;
      tabs.forEach((t, j) => {
        const on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      if (focus) tabs[i].focus();
      onSelect(i);
      return i;
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 };
        if (e.key in keys) { e.preventDefault(); select(keys[e.key], true); }
      });
    });
    return select;
  }

  // What we can help with
  const skillTabs = [...document.querySelectorAll('[data-skill]')];
  makeTabs(skillTabs, $('skill-panel'), (i) => {
    const s = SKILLS[i];
    setText('skill-title', s.title);
    setText('skill-text', s.text);
    $('skill-list').replaceChildren(...s.items.map((x) => Object.assign(document.createElement('li'), { textContent: x })));
    setText('ex-title', s.exTitle);
    const p = $('ex-text');
    p.textContent = s.exText + ' ';
    if (s.exLink) {
      const a = Object.assign(document.createElement('a'), { href: s.exLink[1], target: '_blank', rel: 'noopener noreferrer', textContent: s.exLink[0] });
      p.append(a);
    }
    setText('ex-status', s.status);
  })(0);

  // Partner journey
  const stepTabs = [...document.querySelectorAll('[data-step]')];
  let current = 0;
  const selectStep = makeTabs(stepTabs, $('step-panel'), (i) => {
    current = i;
    const s = STEPS[i];
    setText('step-where', s.where);
    setText('step-title', s.title);
    setText('step-what', s.what);
    setText('step-you', s.you);
    setText('step-we', s.we);
    setText('step-get', s.get);
    setText('step-ico', s.ico);
    setText('step-voice', s.voice);
    stepTabs.forEach((t, j) => t.classList.toggle('done', j < i));
    $('pj-bar').style.width = ((i + 1) / STEPS.length * 100) + '%';
    $('step-back').disabled = i === 0;
    setText('step-next', i === STEPS.length - 1 ? 'How we use your feedback ↓' : 'Next step →');
  });
  selectStep(0);
  $('step-back').addEventListener('click', () => selectStep(current - 1));
  $('step-next').addEventListener('click', () => {
    if (current === STEPS.length - 1) { $('feedback').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    selectStep(current + 1);
  });


  // Deep links such as work-with-us.html#step-4 open that step.
  const m = /^#step-([1-6])$/.exec(location.hash);
  if (m) { selectStep(Number(m[1]) - 1); $('journey').scrollIntoView(); }
})();
