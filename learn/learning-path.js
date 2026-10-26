"use strict";
/* One Learn AI course. Completion keys are shared with lesson-kit.js. */
(function () {
  const lessons = [
    { n: 1, stage: "Foundations", title: "AI Made Simple", detail: "What AI is, how it learns from examples, and what it can and cannot do.", minutes: 15, url: "ai-made-simple.html" },
    { n: 2, stage: "Foundations", title: "Inside an LLM", detail: "Explore tokens, numerical representations, attention and next-token prediction.", minutes: 20, url: "inside-an-llm.html" },
    { n: 3, stage: "Foundations", title: "Prompting & Context", detail: "Write clear prompts, and see how context and temperature change answers.", minutes: 20, url: "prompting-and-context.html" },
    { n: 4, stage: "Building blocks", title: "Embeddings & Search", detail: "Explore numerical representations of text and compare keyword and similarity search.", minutes: 10, url: "embeddings-and-search.html" },
    { n: 5, stage: "Building blocks", title: "Build a RAG System", detail: "Split documents into passages, retrieve evidence and ground answers in it.", minutes: 20, url: "build-a-rag-system.html" },
    { n: 6, stage: "Building blocks", title: "AI Agents", detail: "Explore tools, memory and planning while keeping a person in control.", minutes: 20, url: "ai-agents.html" },
    { n: 7, stage: "Responsible AI", title: "Evaluation & Safety", detail: "Test answers against evidence and explore the limits of guardrails.", minutes: 15, url: "evaluation-and-safety.html" },
    { n: 8, stage: "Responsible AI", title: "AI in Your Organisation", detail: "Consider risks, responsibilities and a one-page AI policy.", minutes: 15, url: "ai-in-your-organisation.html" },
    { n: 9, stage: "AI in practice", title: "Choosing AI Tools", detail: "Set must-haves, weight what matters and compare tools fairly.", minutes: 10, url: "choosing-ai-tools.html" },
    { n: 10, stage: "AI in practice", title: "AI in Your Processes", detail: "Map a process and decide what to keep human, assist or automate.", minutes: 10, url: "ai-in-your-processes.html" },
    { n: 11, stage: "AI in practice", title: "Consistent AI Across Teams", detail: "Use shared templates, an AI register and clear owners across teams.", minutes: 15, url: "consistent-ai.html" },
    { n: 12, stage: "AI in practice", title: "Validating AI in Use", detail: "Plan sample checks, examine uncertainty and spot changes after launch.", minutes: 10, url: "validating-ai-in-use.html" }
  ];
  const prefix = "cwi-learn-";
  const box = document.getElementById("module-container");
  const storageNote = document.getElementById("storage-note");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render() {
    if (!box) return;
    const completed = new Set();
    let storageAvailable = true;
    try {
      lessons.forEach(lesson => {
        if (localStorage.getItem(prefix + lesson.url.replace(/\.html$/, "")) === "complete") completed.add(lesson.n);
      });
    } catch (_error) { storageAvailable = false; }
    box.replaceChildren();
    const stages = [...new Set(lessons.map(lesson => lesson.stage))];
    stages.forEach((stage, index) => {
      const group = lessons.filter(lesson => lesson.stage === stage);
      const heading = element("div", "ml-path-stage");
      const title = element("h3", "", `${String(index + 1).padStart(2, "0")} / ${stage}`);
      title.id = `ai-stage-${index + 1}`;
      heading.append(title, element("span", "", `${group.length} lessons · About ${group.reduce((sum, lesson) => sum + lesson.minutes, 0)} minutes`));
      const grid = element("div", "ml-lessons");
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-labelledby", title.id);
      group.forEach(lesson => {
        const done = completed.has(lesson.n);
        const card = element("article", "ml-lesson-card");
        const top = element("div", "ml-card-top");
        top.append(element("span", "ml-lesson-number", String(lesson.n).padStart(2, "0")), element("span", "ml-tag live", done ? "Completed ✓" : "Ready to explore"));
        const bottom = element("div", "ml-card-bottom");
        const action = element("a", "", done ? "Review lesson ↗" : "Open lesson ↗");
        action.href = lesson.url;
        action.setAttribute("aria-label", `${done ? "Review" : "Open"} lesson ${lesson.n}: ${lesson.title}`);
        bottom.append(element("span", "", `${lesson.minutes} min`), action);
        card.append(top, element("h4", "", lesson.title), element("p", "", lesson.detail), bottom);
        grid.append(card);
      });
      box.append(heading, grid);
    });
    document.getElementById("course-progress").textContent = `${completed.size} of ${lessons.length} lessons completed`;
    const bar = document.getElementById("ai-progress-bar");
    if (bar) { bar.value = completed.size; bar.textContent = `${completed.size} of ${lessons.length}`; }
    const next = lessons.find(lesson => !completed.has(lesson.n));
    const resume = document.getElementById("resume-link");
    const hero = document.getElementById("hero-start-link");
    const href = next ? next.url : "#learning-path";
    if (resume) { resume.href = href; resume.textContent = next ? `${completed.size ? "Continue with" : "Start"} lesson ${next.n} ↗` : "Revisit the lessons ↗"; }
    if (hero) { hero.href = href; hero.textContent = next ? `${completed.size ? "Resume" : "Start"} learning ↗` : "Revisit the lessons ↗"; }
    if (storageNote) storageNote.textContent = storageAvailable
      ? "Progress is saved only in this browser. A lesson completes when you have tried its activities and answered its questions."
      : "Your browser is blocking saved progress. Every lesson is still available, but completion will not be remembered here.";
  }

  const promptExamples = {
    vague: {
      prompt: "Write an update for our volunteers.",
      response: "Hello team! We have some exciting updates to share. Thank you for all your hard work. Stay tuned for more details about our next session.",
      insight: "The request leaves out the change, the audience's next step and the facts the message needs."
    },
    specific: {
      prompt: "Write a friendly, three-sentence email to our volunteers. Use only these facts: Saturday's session is now 10 am–12 noon at Riverside Hall. Ask them to reply by Friday if they can join us. Thank them for helping prepare the community meal.",
      response: "Hello volunteers, Saturday's session is now 10 am–12 noon at Riverside Hall. Please reply by Friday if you can join us. Thank you for helping us prepare the community meal.",
      insight: "The audience, facts and next step give the message a clearer job. This is an illustration, not a guarantee of what a model will write."
    }
  };
  const demoButtons = [...document.querySelectorAll("[data-prompt-example]")];
  function showExample(key) {
    const example = promptExamples[key];
    if (!example) return;
    document.getElementById("prompt-demo-input").textContent = example.prompt;
    document.getElementById("prompt-demo-output").textContent = example.response;
    document.getElementById("prompt-demo-feedback").textContent = example.insight;
    demoButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.promptExample === key)));
  }
  demoButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener("click", () => showExample(button.dataset.promptExample));
  });
  render();
  window.addEventListener("pageshow", render);
  window.addEventListener("storage", event => {
    if (event.key === null || (typeof event.key === "string" && event.key.startsWith(prefix))) render();
  });
})();
