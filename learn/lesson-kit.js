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
  function progress(){
    const total = L.steps.length + (L.quiz.length ? 1 : 0);
    const count = L.steps.filter(s=>done.has(s)).length + (quizPassed ? 1 : 0);
    const text = document.getElementById("progress-text"), bar = document.getElementById("progress-bar");
    if(text) text.textContent = count===total ? "Lesson complete ✓" : `Progress: ${count} of ${total} activities`;
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
      b.addEventListener("click",()=>{answers.fill(null);quizPassed=false;drawQuiz();progress();root.scrollIntoView({block:"start"});});
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
