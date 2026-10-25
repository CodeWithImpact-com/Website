"use strict";
/* Lessons 09–12 (AI in practice) labs. Each lab only runs if its container is on the page.
   09 tool scorecard · 10 process redesign · 11 consistency and templates · 12 monitoring with sample checks.
   Nothing is sent anywhere. */
(function(){
  const {el, mark} = window.CWI;
  const $ = id => document.getElementById(id);

  /* ---------- 09: Choose a tool with a weighted scorecard ---------- */
  if ($("scorecard")) {
    const CRIT = [
      {k:"data", n:"Data protection"},
      {k:"quality", n:"Task quality"},
      {k:"cost", n:"Cost"},
      {k:"ease", n:"Ease of use"},
      {k:"fit", n:"Fits our systems"},
      {k:"exit", n:"Support and exit"},
    ];
    const TOOLS = [
      {n:"QuickWrite Free", d:"A free public chatbot. Very easy to start with. Its terms allow it to use what you type to improve its models.",
       s:{data:1,quality:2,cost:5,ease:5,fit:2,exit:1}, must:false},
      {n:"OfficeAI Business", d:"An AI add-on for the office software you already use. Paid per user. Signs a data processing agreement and doesn't train on your data.",
       s:{data:5,quality:3,cost:3,ease:4,fit:5,exit:3}, must:true},
      {n:"CaseNotes AI", d:"A specialist tool that performs best on the fictional team's case-note checks. UK hosting and a data processing agreement, but the most expensive, and exporting your data is awkward.",
       s:{data:5,quality:5,cost:2,ease:3,fit:3,exit:2}, must:true},
    ];
    const w = {data:3,quality:3,cost:3,ease:3,fit:3,exit:3};
    const PRESETS = [
      {n:"Everything equal", w:{data:3,quality:3,cost:3,ease:3,fit:3,exit:3}},
      {n:"Cheapest and easiest", w:{data:0,quality:0,cost:5,ease:5,fit:1,exit:0}},
      {n:"Data protection first", w:{data:5,quality:3,cost:1,ease:2,fit:3,exit:3}},
      {n:"Case-note quality first", w:{data:3,quality:5,cost:0,ease:0,fit:0,exit:0}},
    ];
    const box = $("scorecard"), out = $("score-out"), mustBox = $("must-have");
    if ($("tool-ratings")) {
      const table = el("table","tool-ratings-table");
      table.append(el("caption",null,"Fictional ratings: 1 is weakest and 5 is strongest. Task quality refers to case-note checks."));
      const head = el("thead"), heading = el("tr");
      ["Criterion", ...TOOLS.map(t=>t.n)].forEach(name=>{const cell=el("th",null,name);cell.setAttribute("scope","col");heading.append(cell);});
      head.append(heading); table.append(head);
      const body = el("tbody");
      CRIT.forEach(c=>{
        const row=el("tr"), label=el("th",null,c.n); label.setAttribute("scope","row"); row.append(label);
        TOOLS.forEach(t=>row.append(el("td",null,String(t.s[c.k])))); body.append(row);
      });
      table.append(body); $("tool-ratings").append(table);
    }
    const sliders = {}, vals = {};
    const pre = el("div","score-presets"); pre.append(el("span","mini-h","Try a preset"));
    PRESETS.forEach(ps=>{
      const b = el("button","fit-btn",ps.n); b.type="button";
      b.addEventListener("click",()=>{Object.assign(w,ps.w); CRIT.forEach(c=>{sliders[c.k].value=w[c.k]; vals[c.k].textContent=w[c.k];}); draw(); mark("scorecard");});
      pre.append(b);
    });
    box.append(pre);
    box.append(el("p","mini-h","Or set your own (0–5)"));
    CRIT.forEach(c=>{
      const row = el("label","weight-row");
      const name = el("span","weight-name",c.n), val = el("b","weight-val",String(w[c.k]));
      const r = el("input"); r.type="range"; r.min="0"; r.max="5"; r.step="1"; r.value=w[c.k];
      r.setAttribute("aria-label","Importance of "+c.n);
      r.addEventListener("input",()=>{w[c.k]=+r.value; val.textContent=r.value; draw(); mark("scorecard");});
      sliders[c.k]=r; vals[c.k]=val;
      row.append(name,r,val); box.append(row);
    });
    mustBox.addEventListener("change",()=>{draw(); mark("scorecard");});
    function draw(){
      const tw = Object.values(w).reduce((a,b)=>a+b,0);
      const score = t => tw ? Math.round(100*CRIT.reduce((a,c)=>a+w[c.k]*t.s[c.k],0)/(5*tw)) : 0;
      const rows = TOOLS.map(t=>({t, score: score(t), out: mustBox.checked && !t.must}));
      const live = rows.filter(r=>!r.out).sort((a,b)=>b.score-a.score);
      const leaders = tw && live.length ? live.filter(r=>r.score===live[0].score) : [];
      out.replaceChildren();
      rows.slice().sort((a,b)=>(a.out-b.out)||(b.score-a.score)).forEach(r=>{
        const leading = leaders.includes(r);
        const card = el("div","tool-card"+(r.out?" ruled-out":"")+(leading?" best":""));
        const head = el("div","tool-head");
        head.append(el("b",null,r.t.n), el("span","tool-score", !tw ? "Not scored" : r.out ? "Would score "+r.score : r.score+" / 100"));
        const bar = el("div","tool-bar"), fill = el("div"); fill.style.width = r.score+"%"; bar.append(fill);
        card.append(head, bar);
        if(r.out) card.append(el("p","tool-badge","Ruled out by the must-have"));
        if(leading) card.append(el("p","tool-badge",leaders.length>1?"Joint highest eligible score":"Highest eligible score"));
        card.append(el("p","tool-desc",r.t.d));
        out.append(card);
      });
      const st = $("score-status");
      if(!tw){ st.textContent = "Set at least one criterion above 0 to compare the tools."; return; }
      if(!leaders.length){ st.textContent = "No tools meet the must-have. Review the requirements or consider other tools."; return; }
      const names = leaders.map(r=>r.t.n).join(" and ");
      const excludedHigher = rows.filter(r=>r.out && r.score>leaders[0].score);
      const result = leaders.length>1
        ? `Joint highest eligible score: ${names}, each at ${leaders[0].score} / 100. The displayed scores are tied; compare the underlying ratings and gather more evidence before choosing.`
        : `Highest eligible score: ${names} (${leaders[0].score} / 100). Changing priorities can change the result. Test real tools on your own tasks before choosing.`;
      const restriction = excludedHigher.length
        ? ` ${excludedHigher.map(r=>r.t.n).join(" and ")} would score higher but fails the must-have. A weighted score cannot override a deal-breaker.`
        : !mustBox.checked && leaders.some(r=>!r.t.must)
          ? " QuickWrite Free can use what you type to train its models. A high score does not remove that risk."
          : "";
      st.textContent = result+restriction;
    }
    draw();
  }

  /* ---------- 10: Redesign a process ---------- */
  if ($("process-steps")) {
    const OPTS = ["Keep human","AI drafts, person checks","Automate"];
    const STEPS = [
      {t:"Read a new volunteer's enquiry and work out what they're asking", ours:1, why:"AI can help summarise and sort enquiries. A person checks the original enquiry against the summary, including anything unusual."},
      {t:"Send the standard information pack", ours:2, why:"Low risk, the same for everyone, and easy to check later. Ordinary rules-based software can send it; this does not need AI."},
      {t:"Check safeguarding and DBS requirements for the role", ours:0, why:"Safeguarding judgements must stay with a trained person. Getting this wrong could put people at risk."},
      {t:"Suggest roles that match their skills and availability", ours:1, why:"AI can shortlist suitable roles quickly. A coordinator makes the actual match, because they know the teams and people involved."},
      {t:"Write a personalised welcome email", ours:1, why:"A good drafting task. A person checks names, dates and tone before it's sent."},
      {t:"Decide whether to accept someone who disclosed a concern", ours:0, why:"A significant decision about a person, needing context and discretion. This stays human, and the reasons should be recorded."},
    ];
    const pick = STEPS.map(()=>null);
    const box = $("process-steps"), flow = $("process-flow");
    function draw(){
      box.replaceChildren(); flow.replaceChildren();
      STEPS.forEach((s,i)=>{
        const card = el("div","fit-card"+(pick[i]!==null?" answered":""));
        card.append(el("p","fit-task",(i+1)+". "+s.t));
        const g = el("div","fit-options"); g.setAttribute("role","group"); g.setAttribute("aria-label","How to handle: "+s.t);
        OPTS.forEach((o,j)=>{
          const b = el("button","fit-btn",o); b.type="button"; b.setAttribute("aria-pressed",String(pick[i]===j));
          if(pick[i]!==null && j===s.ours) b.classList.add("ours");
          b.addEventListener("click",()=>{pick[i]=j; draw(); box.querySelectorAll(".fit-card")[i].querySelectorAll(".fit-btn")[j].focus();});
          g.append(b);
        });
        card.append(g);
        if(pick[i]!==null){
          const fb = el("p","fit-feedback");
          fb.append(el("b",null, pick[i]===s.ours ? "Same as ours. " : "We'd say: "+OPTS[s.ours]+". "), document.createTextNode(s.why));
          card.append(fb);
        }
        box.append(card);
        const node = el("div","pf-step pf-"+(pick[i]===null?"none":["human","assist","auto"][pick[i]]));
        node.append(el("span","pf-num",String(i+1)), el("span","pf-lab", pick[i]===null?"Not decided":OPTS[pick[i]]));
        flow.append(node);
      });
      const n = pick.filter(x=>x!==null).length;
      const human = pick.filter(x=>x===0).length, assisted = pick.filter(x=>x===1).length, automated = pick.filter(x=>x===2).length;
      const risky = STEPS.filter((s,i)=>s.ours===0 && pick[i]===2).length;
      $("process-status").textContent = n<STEPS.length ? `${n} of ${STEPS.length} steps decided.`
        : risky ? `You automated ${risky} step${risky>1?"s":""} that involve${risky>1?"":"s"} judgement about people. Keep those decisions with a trained person, since errors could cause harm.`
        : human===STEPS.length ? "Your process keeps all six steps with people. No AI or automation is included. This may be reasonable if the team can manage the workload."
        : `Your process has ${human} human-only step${human===1?"":"s"}, ${assisted} AI drafting step${assisted===1?"":"s"} with a person checking, and ${automated} automated step${automated===1?"":"s"}. `+
          (assisted ? "Check whether this saves time without weakening the decisions people need to make." : "No AI drafting is included. Routine automation can use ordinary rules-based software.");
      if(n===STEPS.length) mark("process");
    }
    draw();
  }

  /* ---------- 11: Consistency: ad hoc prompts vs a shared template ---------- */
  if ($("consistency")) {
    const PEOPLE = [
      {who:"Asha", adhoc:"summarise this", adOut:"The event received a wide range of feedback. Many attendees enjoyed the evening, particularly the speakers, although some raised concerns about the venue and access. Several people suggested improvements for next time, including timing and food options, and there was general support for holding another event in future…",
       tplOut:"• 42 of 50 attendees rated the evening good or excellent.\n• Most praise was for the speakers.\n• 6 people reported step-free access problems at the venue.\nAction needed: confirm an accessible venue before booking."},
      {who:"Ben", adhoc:"make this short and upbeat for social", adOut:"What a night! 95% of you loved it 🎉 Huge thanks to our amazing speakers. See you next year!",
       tplOut:"• 42 of 50 attendees rated the evening good or excellent.\n• Speakers were the highlight.\n• Venue access was a problem for 6 people.\nAction needed: confirm an accessible venue before booking."},
      {who:"Chloe", adhoc:"key points pls", adOut:"- Good event\n- Speakers good\n- Food could be better\n- Venue ok",
       tplOut:"• 42 of 50 attendees rated the evening good or excellent.\n• Speakers received the most positive comments.\n• 6 attendees had step-free access problems.\nAction needed: confirm an accessible venue before booking."},
    ];
    const NOTES = ["Long, and the access problem is buried.","Invents a figure (95%) and drops the access problem entirely.","Misses the access problem, which was the one thing needing action."];
    const box = $("consistency"), tgl = $("use-template");
    function draw(){
      box.replaceChildren();
      const on = tgl.checked;
      PEOPLE.forEach((p,i)=>{
        const c = el("div","cons-card");
        c.append(el("p","mini-h",p.who+"'s prompt"));
        c.append(el("p","cons-prompt", on ? "Shared template: “Trustee feedback summary”" : "“"+p.adhoc+"”"));
        c.append(el("p","mini-h","Illustrative output"));
        c.append(el("pre","cons-out", on ? p.tplOut : p.adOut));
        if(!on) c.append(el("p","cons-note",NOTES[i]));
        box.append(c);
      });
      $("cons-status").textContent = on
        ? "These scripted examples use the same structure and retain the key facts and action. A shared template can help consistency, but it cannot guarantee accuracy or completeness. Check facts and omissions against the source each time."
        : "Three volunteers, the same source data, and three scripted examples of different results. Each needs checking against the source before it goes to trustees.";
      if(on) mark("consistency");
    }
    tgl.addEventListener("change",draw); draw();

    const out = $("tpl-out");
    const v = id => ($(id).value||"").trim();
    function build(){
      out.textContent = [
        `TEMPLATE: ${v("t-name")||"[Template name]"}`,
        `Owner: ${v("t-owner")||"[role]"} · Approved tool: ${v("t-tool")||"[tool]"}`,
        ``,
        `You are helping ${v("t-role")||"[our team]"}.`,
        `Task: ${v("t-task")||"[what the AI should do]"}`,
        `Audience: ${v("t-aud")||"[who will read it]"}`,
        `Format: ${v("t-format")||"[length and structure]"}`,
        `Rules:`,
        `- Only use the information provided below.`,
        `- If something isn't in the information, write "Not in the data".`,
        `- Don't include names or personal details.`,
        ``,
        `Human review before sharing:`,
        `- Check every fact and figure against the source information.`,
        `- Check for missing concerns, decisions and actions.`,
        `- Confirm that personal details have been removed.`,
        `- Correct the draft and approve it before sharing.`,
        ``,
        `Information:`,
        `{{paste the information here}}`,
      ].join("\n");
    }
    $("tpl-form").addEventListener("input",build); build();
    $("tpl-copy").addEventListener("click", async ()=>{
      try{ await navigator.clipboard.writeText(out.textContent); $("tpl-status").textContent="Copied. Save it in your shared template library."; }
      catch(_e){ $("tpl-status").textContent="Couldn't copy automatically. Select the text and copy it."; }
      mark("template");
    });
  }

  /* ---------- 12: Monitoring with weekly sample checks ---------- */
  if ($("monitor")) {
    const WEEKS = 20, CHANGE = 12, P_BEFORE = .92, P_AFTER = .78;
    let seed = 20261025; const rnd = ()=>{ seed = (seed*1664525 + 1013904223) % 4294967296; return seed/4294967296; };
    const DRAWS = Array.from({length:WEEKS}, ()=>Array.from({length:100}, rnd)); // fixed, so results are stable
    const svg = $("monitor"), NS = "http://www.w3.org/2000/svg";
    const node=(t,a,txt)=>{const n=document.createElementNS(NS,t);for(const k in a)n.setAttribute(k,a[k]);if(txt!==undefined)n.textContent=txt;return n;};
    const nIn = $("m-n"), thIn = $("m-th");
    const W=640,H=300,L=46,R=14,T=16,B=36, X=w=>L+(w-.5)*(W-L-R)/WEEKS, Y=p=>T+(1-p)*(H-T-B);
    function wilson(k,n){const z=1.96,ph=k/n,den=1+z*z/n,c=(ph+z*z/(2*n))/den,h=z*Math.sqrt(ph*(1-ph)/n+z*z/(4*n*n))/den;return [Math.max(0,c-h),Math.min(1,c+h)];}
    function draw(){
      const n = +nIn.value, th = +thIn.value/100;
      $("m-n-val").textContent = n; $("m-th-val").textContent = thIn.value+"%";
      svg.replaceChildren();
      [0,.2,.4,.6,.8,1].forEach(p=>{svg.append(node("line",{x1:L,x2:W-R,y1:Y(p),y2:Y(p),class:"m-grid"}));svg.append(node("text",{x:L-8,y:Y(p)+4,"text-anchor":"end",class:"m-axis"},Math.round(p*100)+"%"));});
      for(let w=1;w<=WEEKS;w+=1) if(w%2===1||w===WEEKS) svg.append(node("text",{x:X(w),y:H-B+18,"text-anchor":"middle",class:"m-axis"},String(w)));
      svg.append(node("text",{x:(L+W-R)/2,y:H-4,"text-anchor":"middle",class:"m-axis"},"Week"));
      svg.append(node("rect",{x:X(CHANGE)-((W-L-R)/WEEKS)/2,y:T,width:(W-R)-(X(CHANGE)-((W-L-R)/WEEKS)/2),height:H-T-B,class:"m-change"}));
      svg.append(node("text",{x:X(CHANGE)-((W-L-R)/WEEKS)/2+6,y:T+14,class:"m-axis m-change-lab"},"New referral form introduced"));
      svg.append(node("line",{x1:L,x2:W-R,y1:Y(th),y2:Y(th),class:"m-th"}));
      const pts=[]; let beforeAlerts=0, firstAlert=null;
      for(let w=1;w<=WEEKS;w++){
        const p = w<CHANGE?P_BEFORE:P_AFTER, k = DRAWS[w-1].slice(0,n).filter(u=>u<p).length, obs=k/n, [lo,hi]=wilson(k,n);
        const alert = obs<th;
        if(alert && w<CHANGE) beforeAlerts++;
        if(alert && w>=CHANGE && firstAlert===null) firstAlert=w;
        svg.append(node("line",{x1:X(w),x2:X(w),y1:Y(lo),y2:Y(hi),class:"m-ci"}));
        pts.push([X(w),Y(obs),alert]);
      }
      svg.append(node("polyline",{points:pts.map(p=>p[0]+","+p[1]).join(" "),class:"m-line"}));
      pts.forEach(([x,y,a])=>svg.append(node("circle",{cx:x,cy:y,r:5,class:a?"m-pt alert":"m-pt"})));
      $("m-status").textContent =
        `Checking ${n} outputs a week: ${beforeAlerts} alert${beforeAlerts===1?"":"s"} before the form changes in week ${CHANGE}. `+
        (firstAlert ? `The first sample below the quality target from week ${CHANGE} onward is in week ${firstAlert}.` : `No sample from week ${CHANGE} onward falls below the quality target.`)+
        (th>P_BEFORE ? ` Your ${Math.round(th*100)}% target is above the simulated 92% baseline, so earlier alerts can reflect an existing quality gap.` : " Even before the change, sampling variation can produce alerts.")+
        " An alert means the sample missed the target; it does not prove what caused it. The bars show 95% Wilson intervals for each week's sample.";
    }
    [nIn,thIn].forEach(i=>i.addEventListener("input",()=>{draw();mark("monitor");}));
    draw();
  }
})();
