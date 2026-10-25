"use strict";
/* Lesson 01 labs: a real (tiny) naive Bayes classifier trained in the browser, and the "Can AI help?" cards. */
(function(){
  const {el, mark} = window.CWI;

  /* ---------- Lab 1: teach a model ---------- */
  const STOP = new Set("a an the and or for to of in on at is are was be been with from about this that it its i we you our your my me can do does did has have had will would just".split(" "));
  const train = [
    ["Volunteer fell at the event, ambulance called", true],
    ["Thank you for the lovely newsletter", false],
    ["Data breach: laptop with donor list stolen", true],
    ["Can I change my monthly donation date?", false],
    ["Event venue cancelled for tomorrow morning", true],
    ["Photos from last month's bake sale", false],
    ["Safeguarding concern raised about a home visit today", true],
    ["Ideas for next year's fundraising calendar", false],
  ];
  const tests = [
    "Venue flooded, event starts in an hour",
    "Newsletter ideas for next month",
    "Office laptop stolen overnight",
    "Question about my donation receipt",
  ];
  const labels = train.map(t=>t[1]);
  const words = s => s.toLowerCase().match(/[a-z']+/g).map(w=>w.replace(/'s$/,"")).filter(w=>!STOP.has(w));

  const setBox = document.getElementById("train-set");
  function drawSet(){
    setBox.replaceChildren();
    train.forEach(([text],i)=>{
      const row = el("div","train-row");
      row.append(el("span","train-text",text));
      const btn = el("button","label-toggle "+(labels[i]?"urgent":"wait"), labels[i]?"Urgent":"Can wait");
      btn.type="button";
      btn.setAttribute("aria-label",`Label for “${text}”: ${labels[i]?"Urgent":"Can wait"}. Press to switch.`);
      btn.addEventListener("click",()=>{labels[i]=!labels[i];drawSet();
        document.getElementById("train-status").textContent="Labels changed. Train again to update the model.";
        setBox.querySelectorAll(".label-toggle")[i].focus();});
      row.append(btn); setBox.append(row);
    });
  }

  function fit(){
    const count={true:{},false:{}}, total={true:0,false:0}, docs={true:0,false:0}, vocab=new Set();
    train.forEach(([t],i)=>{const c=labels[i];docs[c]++;words(t).forEach(w=>{count[c][w]=(count[c][w]||0)+1;total[c]++;vocab.add(w);});});
    const V=vocab.size;
    const wscore = w => vocab.has(w)
      ? Math.log(((count.true[w]||0)+1)/(total.true+V)) - Math.log(((count.false[w]||0)+1)/(total.false+V))
      : null;
    const prior = Math.log((docs.true+1)/(docs.false+1));
    return text => {
      const parts = words(text).map(w=>({w,s:wscore(w)}));
      const known = parts.filter(p=>p.s!==null);
      const s = prior + known.reduce((a,p)=>a+p.s,0);
      const p = 1/(1+Math.exp(-s));
      return {p, known, unknown: parts.filter(p=>p.s===null).map(p=>p.w)};
    };
  }

  document.getElementById("train-btn").addEventListener("click",()=>{
    const model = fit(), out = document.getElementById("predictions");
    out.replaceChildren(el("h3",null,"Predictions on new messages"), el("p","hint","These scores come from just eight training messages. They have not been calibrated against unseen examples, so a score of 90% does not mean the prediction has a 90% chance of being correct."));
    tests.forEach(t=>{
      const r = model(t), urgent = r.p>=0.5;
      const card = el("div","prediction "+(urgent?"urgent":"wait"));
      card.append(el("p","pred-text","“"+t+"”"));
      const verdict = el("p","pred-verdict");
      verdict.append(el("b",null,urgent?"Urgent":"Can wait"), document.createTextNode(` · ${Math.round(100*(urgent?r.p:1-r.p))}% model score`));
      const bar = el("div","pred-bar"), fill = el("div"); fill.style.width = Math.round(r.p*100)+"%"; bar.append(fill);
      bar.setAttribute("aria-hidden","true");
      const top = r.known.slice().sort((a,b)=>Math.abs(b.s)-Math.abs(a.s)).slice(0,2);
      const why = el("p","pred-why");
      why.textContent = top.length
        ? "Main evidence: " + top.map(x=>`“${x.w}” (${x.s>0?"→ urgent":"→ can wait"})`).join(", ")
        : "The model has not seen any of these words before. It is guessing based on how common each label is.";
      card.append(verdict, bar, why);
      if(r.unknown.length) card.append(el("p","pred-unknown","Never seen: "+r.unknown.join(", ")));
      out.append(card);
    });
    document.getElementById("train-status").textContent = "Trained on " + train.length + " labelled messages.";
    mark("train");
  });
  drawSet();

  /* ---------- Lab 2: can AI help? ---------- */
  const OPTIONS = ["Good fit","Use with care","Not a good fit"];
  const tasks = [
    {t:"Drafting a first version of a thank-you email to volunteers", a:0, why:"Low risk and easy to check. A person reviews and personalises it before sending."},
    {t:"Grouping 300 open-text survey comments into themes", a:0, why:"AI is good at spotting themes in text. Spot-check a sample, and check any quotes it pulls out are real."},
    {t:"Finding published research for a literature review", a:1, why:"Helpful for discovery, but AI tools can invent papers. Every reference must be checked against the original source."},
    {t:"Translating a health leaflet into Polish", a:1, why:"A useful first draft, but health information needs checking by a fluent speaker before it is shared."},
    {t:"Telling a carer what dose of medication to give", a:2, why:"Medical advice must come from a qualified professional. Errors could cause real harm."},
    {t:"Deciding whether a person qualifies for support", a:2, why:"Decisions about individuals need fairness, transparency and accountability. AI may support staff, but should not decide."},
  ];
  const chosen = new Array(tasks.length).fill(null);
  const box = document.getElementById("fit-cards");
  function drawFit(){
    box.replaceChildren();
    tasks.forEach((task,i)=>{
      const card = el("div","fit-card"+(chosen[i]!==null?" answered":""));
      card.append(el("p","fit-task",task.t));
      const group = el("div","fit-options"); group.setAttribute("role","group"); group.setAttribute("aria-label","Is AI a good fit for: "+task.t);
      OPTIONS.forEach((o,j)=>{
        const b = el("button","fit-btn",o); b.type="button";
        b.setAttribute("aria-pressed",String(chosen[i]===j));
        if(chosen[i]!==null && j===task.a) b.classList.add("ours");
        b.addEventListener("click",()=>{chosen[i]=j;drawFit();box.querySelectorAll(".fit-card")[i].querySelectorAll(".fit-btn")[j].focus();});
        group.append(b);
      });
      card.append(group);
      if(chosen[i]!==null){
        const agree = chosen[i]===task.a;
        const fb = el("p","fit-feedback");
        fb.append(el("b",null,(agree?"We agree. ":"Our view: "+OPTIONS[task.a]+". ")), document.createTextNode(task.why));
        card.append(fb);
      }
      box.append(card);
    });
    const n = chosen.filter(c=>c!==null).length;
    document.getElementById("fit-status").textContent = n<tasks.length ? `${n} of ${tasks.length} answered.` : "You have answered every question. Compare how the risks to people affected each recommendation.";
    if(n===tasks.length) mark("fit");
  }
  drawFit();
})();
