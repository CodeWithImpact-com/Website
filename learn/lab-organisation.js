"use strict";
/* Lesson 08 labs: traffic-light everyday AI requests, and build a one-page AI policy in the browser.
   Nothing is sent anywhere. */
(function(){
  const {el, mark} = window.CWI;

  /* ---------- Traffic-light the request ---------- */
  const OPTIONS = ["Go ahead", "Go ahead with safeguards", "Stop and check first"];
  const CASES = [
    {t:"A volunteer uses a free public chatbot to draft social media posts about next month's fun run.",
     ours:0, why:"No personal data goes in, and a person reviews the post before it's published. Low risk."},
    {t:"A support worker pastes a service user's case notes into a free chatbot to help write a referral letter.",
     ours:2, why:"Health details are special category data. An unapproved free tool may keep the text or use it to train its models. Use an approved tool, or remove the identifying details first."},
    {t:"The research team summarises anonymised survey results using the organisation's approved AI tool.",
     ours:1, why:"A sensible use. Check that small groups can't be re-identified (\"the only respondent from Wales\") and check every figure in the summary against the data."},
    {t:"The grants panel uses AI to score applications and automatically rejects the lowest third.",
     ours:2, why:"A significant decision about people made with no meaningful human involvement. The law requires safeguards such as telling applicants and letting them challenge it, and the scores may carry bias. Use AI to assist reviewers, not to decide."},
    {t:"A chatbot on your website answers questions about your services.",
     ours:1, why:"Can work well with safeguards: tell people they're talking to AI, hand medical and safeguarding questions to a person, test it before launch and review conversations regularly. Do a data protection impact assessment first."},
    {t:"An AI notetaker records and summarises a trustee meeting.",
     ours:1, why:"Tell everyone it's recording, check the summary is accurate before it becomes the minutes, and check where the recording is stored and for how long."},
  ];
  const chosen = CASES.map(()=>null);
  const box = document.getElementById("traffic-cards");
  function drawTraffic(){
    box.replaceChildren();
    CASES.forEach((c,i)=>{
      const card = el("div","fit-card"+(chosen[i]!==null?" answered":""));
      card.append(el("p","fit-task",c.t));
      const group = el("div","fit-options"); group.setAttribute("role","group"); group.setAttribute("aria-label","Decision for: "+c.t);
      OPTIONS.forEach((o,j)=>{
        const b = el("button","fit-btn",o); b.type="button";
        b.setAttribute("aria-pressed", String(chosen[i]===j));
        if(chosen[i]!==null && j===c.ours) b.classList.add("ours");
        b.addEventListener("click",()=>{chosen[i]=j;drawTraffic();box.querySelectorAll(".fit-card")[i].querySelectorAll(".fit-btn")[j].focus();});
        group.append(b);
      });
      card.append(group);
      if(chosen[i]!==null){
        const same = chosen[i]===c.ours;
        const fb = el("p","fit-feedback");
        fb.append(el("b",null,(same?"Same as ours. ":"We'd say: "+OPTIONS[c.ours]+". ")), document.createTextNode(c.why));
        card.append(fb);
      }
      box.append(card);
    });
    const n = chosen.filter(x=>x!==null).length;
    document.getElementById("traffic-status").textContent = n<CASES.length
      ? `${n} of ${CASES.length} answered.`
      : "All answered. Notice that the risky cases share a pattern: sensitive data going into an unapproved tool, or a machine making decisions about people.";
    if(n===CASES.length) mark("traffic");
  }
  drawTraffic();

  /* ---------- Build your AI policy ---------- */
  const form = document.getElementById("policy-form"), out = document.getElementById("policy-out");
  const val = id => (document.getElementById(id).value || "").trim();
  function checked(name){ return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value); }
  function buildPolicy(){
    const org = val("p-org") || "[Organisation name]";
    const tools = val("p-tools") || "[list the AI tools you have approved]";
    const owner = val("p-owner") || "[role, e.g. Operations Lead]";
    const review = val("p-review") || "[month and year]";
    const never = checked("never"), rules = checked("rule");
    const lines = [
      `${org}: How we use AI`,
      ``,
      `Purpose`,
      `We use AI tools to save time and improve our work, in ways that support our purpose and protect the people we work with.`,
      ``,
      `1. Approved tools`,
      `Only use these tools for work: ${tools}. Ask ${owner} before trying a new one.`,
      ``,
      `2. Never put this into an AI tool`,
      ...(never.length ? never.map(n=>`- ${n}`) : ["- [choose at least one category]"]),
      ``,
      `3. How we use AI`,
      ...(rules.length ? rules.map(r=>`- ${r}`) : ["- [choose your rules]"]),
      ``,
      `4. Decisions about people`,
      `AI can help us prepare, but a person makes and owns every decision about an individual, such as funding, support or volunteering.`,
      ``,
      `5. Questions and problems`,
      `If you're unsure, or something goes wrong (for example, personal data was entered by mistake), tell ${owner} straight away. Mistakes reported early are easier to fix.`,
      ``,
      `Owner: ${owner}. Next review: ${review}.`,
    ];
    out.textContent = lines.join("\n");
  }
  form.addEventListener("input", buildPolicy);
  form.addEventListener("change", buildPolicy);
  buildPolicy();
  document.getElementById("policy-copy").addEventListener("click", async ()=>{
    const s = document.getElementById("policy-status");
    try { await navigator.clipboard.writeText(out.textContent); s.textContent = "Copied. Paste it into a document, then review it with your trustees."; }
    catch(_e){ s.textContent = "Couldn't copy automatically. Select the text and copy it."; }
    mark("policy");
  });
})();
