"use strict";
/* Code With Impact: Learn AI: shared lesson behaviour.
   Each lesson page defines window.LESSON = {slug, steps:[...], quiz:[...]} before this script runs.
   Labs call CWI.mark("step-name") when the learner completes an interactive step.
   Nothing is sent anywhere: progress lives only in this browser (localStorage), and the page works without it. */
(function(){
  const L = window.LESSON || {slug:"lesson", steps:[], quiz:[]};
  const KEY = "cwi-learn-" + L.slug;
  const done = new Set();
  let quizPassed = false;

  function el(tag, cls, txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
  function store(k,v){try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v);}catch(_e){}}

  /* ---------- Progress ---------- */
  // Plain names for each activity, shown as a checklist like Learn ML's "Your progress" box.
  const STEP_LABELS = {
    train:"Train the tiny model", fit:"Decide whether AI can help",
    "stage-0":"Explore tokens", "stage-1":"Explore vectors", "stage-2":"Explore attention", "stage-3":"Explore prediction",
    prompt:"Build a better prompt", temperature:"Try the temperature dial", window:"Fill the context window",
    map:"Explore the meaning map", compare:"Compare keyword and meaning search",
    chunk:"Split the documents", retrieve:"Retrieve the best passages", generate:"Generate a grounded answer", norag:"Compare with no retrieval",
    toolcall:"Look inside a tool call", agent:"Be the agent", patterns:"Explore agent design patterns",
    evaluate:"Be the evaluator", guard:"Try a guardrail",
    traffic:"Traffic-light the request", policy:"Build your AI policy",
    scorecard:"Compare tools with the scorecard", process:"Redesign the onboarding process",
    consistency:"Compare three volunteers' results", template:"Build a shared template", monitor:"Spot the drift"
  };
  function buildChecklist(){
    const holder = document.querySelector(".toc-progress");
    if(!holder || holder.querySelector(".ml-progress-box")) return;
    const box = el("div","ml-progress-box ai-progress-box");
    box.append(el("p","ml-eyebrow","Your progress"));
    const list = el("ul");
    L.steps.forEach(s=>{const li=el("li","",STEP_LABELS[s]||"Try the activity");li.id="ai-step-"+s;list.append(li);});
    if(L.quiz.length){const li=el("li","",`Answer all ${L.quiz.length} questions correctly`);li.id="ai-step-quiz";list.append(li);}
    box.append(list);
    const text = document.getElementById("progress-text");
    if(text){text.className="ml-progress-state";text.setAttribute("role","status");text.setAttribute("aria-live","polite");box.append(text);}
    const bar = holder.querySelector(".progress-bar"); if(bar) bar.hidden = true;
    holder.prepend(box);
  }
  function progress(){
    buildChecklist();
    L.steps.forEach(s=>{const li=document.getElementById("ai-step-"+s); if(li) li.classList.toggle("done",done.has(s));});
    const q=document.getElementById("ai-step-quiz"); if(q) q.classList.toggle("done",quizPassed);
    const total = L.steps.length + (L.quiz.length ? 1 : 0);
    const count = L.steps.filter(s=>done.has(s)).length + (quizPassed ? 1 : 0);
    const text = document.getElementById("progress-text"), bar = document.getElementById("progress-bar");
    if(text) text.textContent = count===total ? "Lesson complete ✓" : "Not complete yet.";
    if(bar) bar.style.width = (total ? Math.round(100*count/total) : 0) + "%";
    if(count===total && total>0) store(KEY,"complete");
  }
  function mark(step){ if(!done.has(step)){done.add(step);progress();} }
  function unmark(step){ if(done.delete(step)){store(KEY,null);progress();} }

  /* ---------- Tabs (any [role=tablist] whose tabs have aria-controls) ---------- */
  function setupTabs(list, onChange){
    const tabs=[...list.querySelectorAll('[role="tab"]')];
    // If every tab controls the same panel, the caller redraws that panel itself (onChange).
    const shared=new Set(tabs.map(t=>t.getAttribute("aria-controls"))).size===1;
    function select(i, focus){
      tabs.forEach((t,j)=>{const on=j===i;t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1;
        const p=document.getElementById(t.getAttribute("aria-controls"));
        if(p){ if(shared){ if(on)p.setAttribute("aria-labelledby",t.id); } else p.hidden=!on; }});
      if(focus)tabs[i].focus();
      if(onChange)onChange(i,tabs[i]);
    }
    tabs.forEach((t,i)=>t.addEventListener("click",()=>select(i,false)));
    list.addEventListener("keydown",e=>{
      const cur=tabs.findIndex(t=>t.getAttribute("aria-selected")==="true");
      const map={ArrowRight:(cur+1)%tabs.length,ArrowLeft:(cur-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1};
      if(e.key in map){e.preventDefault();select(map[e.key],true);}
    });
    return select;
  }

  /* ---------- Quiz ---------- */
  function drawQuiz(){
    const root=document.getElementById("quiz-content"), res=document.getElementById("quiz-result");
    if(!root||!L.quiz.length) return;
    const answers = drawQuiz.answers || (drawQuiz.answers = new Array(L.quiz.length).fill(null));
    root.replaceChildren(); res.replaceChildren();
    L.quiz.forEach((q,idx)=>{
      const block=el("fieldset","quiz-block");
      block.append(el("legend","quiz-question",`${idx+1}. ${q.q}`));
      const choices=el("div","choices");
      q.choices.forEach((txt,c)=>{
        const b=el("button","choice",txt); b.type="button";
        if(answers[idx]!==null){ b.disabled=true;
          if(c===q.a){b.classList.add("correct");b.prepend(el("span","sr-only","Correct answer: "));}
          else if(c===answers[idx]){b.classList.add("incorrect");b.prepend(el("span","sr-only","Your answer: "));}
        }
        b.addEventListener("click",()=>{answers[idx]=c;drawQuiz();
          const next=document.querySelectorAll(".quiz-block")[idx];if(next)next.querySelector(".quiz-feedback")?.focus?.();});
        choices.append(b);
      });
      block.append(choices);
      if(answers[idx]!==null){
        const ok=answers[idx]===q.a;
        const fb=el("p","quiz-feedback "+(ok?"good":"bad"),(ok?"✓ Correct. ":"Not quite. ")+q.explain);fb.tabIndex=-1;
        block.append(fb);
      }
      root.append(block);
    });
    if(answers.every(a=>a!==null)){
      const score=answers.reduce((n,a,i)=>n+(a===L.quiz[i].a?1:0),0);
      quizPassed = score===L.quiz.length;
      res.append(el("strong",null,`You scored ${score} out of ${L.quiz.length}.`),
        el("p",null,quizPassed?"You've completed the knowledge check. Well done!":"Read the explanations above, then try again."));
      const b=el("button","btn secondary small","Try again ↺");b.type="button";
      b.addEventListener("click",()=>{answers.fill(null);quizPassed=false;store(KEY,null);drawQuiz();progress();root.scrollIntoView({block:"start"});});
      res.append(b);
      progress();
    }
  }

  /* ---------- Copy-to-clipboard buttons: <button data-copy="#id"> ---------- */
  function setupCopy(){
    document.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",async()=>{
      const src=document.querySelector(b.dataset.copy); if(!src) return;
      const old=b.textContent;
      try{await navigator.clipboard.writeText(src.innerText);b.textContent="Copied ✓";}
      catch(_e){b.textContent="Select the text and copy it manually";}
      setTimeout(()=>b.textContent=old,2000);
    }));
  }

  window.CWI={mark, unmark, setupTabs, el, progress};
  document.addEventListener("DOMContentLoaded",()=>{drawQuiz();setupCopy();progress();});
})();
