"use strict";
/* Lesson 03 labs: prompt builder (pre-written illustrative responses), temperature (real softmax + sampling),
   context window (real token budgeting over a fixed conversation). */
(function(){
  const {el, mark} = window.CWI;

  /* ---------- Lab 1: prompt builder ---------- */
  const SURVEY = "Volunteer survey, 42 responses: 31 said they feel valued; 18 mentioned confusing rota emails; 12 asked for more safeguarding training; 6 travel over an hour to volunteer.";
  const ING = [
    {k:"role", label:"Role", text:"You are helping a small health charity report to its trustees."},
    {k:"task", label:"Clear task", text:"Summarise the key findings of our volunteer survey and suggest one action."},
    {k:"context", label:"Survey data", text:"Here is the data:\n" + SURVEY},
    {k:"audience", label:"Audience", text:"The readers are trustees with five minutes to read it."},
    {k:"format", label:"Format", text:"Use exactly three bullet points, then one suggested action."},
    {k:"guard", label:"If unsure…", text:"Only use the data provided. If something isn't in the data, say so."},
  ];
  const on = new Set();
  const chipBox = document.getElementById("ingredients");
  ING.forEach(i=>{
    const b = el("button","chip",(i.k==="task"?"✎ ":"+ ")+i.label); b.type="button"; b.setAttribute("aria-pressed","false");
    b.addEventListener("click",()=>{on.has(i.k)?on.delete(i.k):on.add(i.k);b.setAttribute("aria-pressed",String(on.has(i.k)));drawPrompt();});
    chipBox.append(b);
  });
  function drawPrompt(){
    const parts = ING.filter(i=>on.has(i.k)).map(i=>i.text);
    if(!on.has("task")) parts.splice(on.has("role")?1:0,0,"Summarise the survey.");
    document.getElementById("prompt-out").textContent = parts.join("\n\n");
    const out = document.getElementById("response-out"); out.replaceChildren();
    const flags = [];
    if(!on.has("context")){
      out.append(el("p",null,"The survey shows that 87% of volunteers are highly satisfied with their experience. Most volunteers appreciate the flexibility offered and the strong sense of community. Some volunteers suggested improvements to parking and refreshments. Overall, the results are very positive and reflect the organisation's commitment to its volunteers."));
      flags.push(["bad","Invented findings: the model never saw the survey, so the 87%, parking and refreshments are made up."]);
    } else if(!(on.has("format")||on.has("audience"))){
      out.append(el("p",null,"The volunteer survey received 42 responses. Overall, a majority of respondents (31) indicated that they feel valued in their role, which is a positive sign for volunteer engagement. However, a number of areas for improvement were identified. Eighteen respondents mentioned that rota emails were confusing, suggesting there may be scope to improve how shifts are communicated. In addition, twelve volunteers expressed a desire for more safeguarding training, and six reported travelling over an hour to volunteer, although the supplied summary does not explain why. It may be worth considering these findings further as part of wider volunteer strategy discussions."));
      flags.push(["ok","This reports the supplied figures, but is too long and unfocused for busy trustees."]);
    } else {
      const ul = el("ul");
      ["31 of 42 respondents (74%) say they feel valued.","18 respondents mentioned confusing rota emails.","12 respondents asked for more safeguarding training."].forEach(t=>ul.append(el("li",null,t)));
      out.append(ul);
      out.append(el("p",null,"Suggested action: redesign the rota email with volunteers."));
      flags.push(["good","Accurate, concise and shaped for the audience."]);
    }
    if(on.has("context") && on.has("guard")){
      out.append(el("p","muted-line","Note: the supplied summary does not explain why six respondents travel over an hour, so I haven't inferred their reasons."));
      flags.push(["good","Says what the data can't support, instead of guessing."]);
    }
    if(!on.has("task")) flags.push(["warn","Vague task: add “Clear task” to say what a good result looks like."]);
    const list = el("ul","flags");
    flags.forEach(([cls,t])=>list.append(el("li","flag "+cls,t)));
    out.append(list);
    if(on.has("context") && (on.has("format")||on.has("audience"))) mark("prompt");
  }
  drawPrompt();

  /* ---------- Lab 2: temperature ---------- */
  const WORDS = [["amazing",2.2],["dedicated",2.0],["wonderful",1.6],["essential",1.3],["tired",0.4],["purple",-1.5]];
  const slider = document.getElementById("temp");
  const softmax = T => { const ex = WORDS.map(([,z])=>Math.exp(z/T)); const s = ex.reduce((a,b)=>a+b,0); return ex.map(x=>x/s); };
  function drawTemp(){
    const T = Number(slider.value), p = softmax(T);
    document.getElementById("temp-val").textContent = T.toFixed(1);
    const box = document.getElementById("temp-bars"); box.replaceChildren();
    WORDS.forEach(([w],i)=>{
      const row=el("div","bar-row"), track=el("div","bar-track"), fill=el("div","fill");
      fill.style.width=(100*p[i]).toFixed(1)+"%"; track.append(fill);
      row.append(el("span",null,w), track, el("span",null,(100*p[i]).toFixed(p[i]<0.01?1:0)+"%"));
      box.append(row);
    });
  }
  slider.addEventListener("input",drawTemp);
  document.getElementById("sample-btn").addEventListener("click",()=>{
    const T = Number(slider.value), p = softmax(T);
    const box = document.getElementById("samples"); box.replaceChildren(el("p","mini-h",`10 completions at temperature ${T.toFixed(1)}:`));
    const row = el("div","tokens");
    for(let k=0;k<10;k++){ let r=Math.random(), i=0; while(i<p.length-1 && (r-=p[i])>0) i++; row.append(el("span","token","Our volunteers are "+WORDS[i][0])); }
    box.append(row);
    box.append(el("p","hint", T<0.5 ? "Low temperature: almost always the top choice: predictable." : T>1.4 ? "High temperature: much more variety, including odd choices like “purple”." : "Moderate temperature: mostly sensible words, with some variety."));
    mark("temperature");
  });
  drawTemp();

  /* ---------- Lab 3: context window ---------- */
  const CONVO = [
    ["You","Please always use British spelling, and never mention individual donors by name in anything you write.",28],
    ["AI","Understood. I'll use British spelling and keep donors anonymous.",16],
    ["You","Here are the notes from our spring fundraising campaign… (long notes pasted)",240],
    ["AI","Thanks. The campaign raised funds through three events and an online appeal… (long summary)",180],
    ["You","Now draft a thank-you section for the annual report covering the top contributors.",22],
    ["AI","Here is a draft thank-you section… (long draft)",210],
    ["You","Can you make it warmer and add a line about the summer fun run?",18],
  ];
  const wslider = document.getElementById("window");
  function drawWindow(){
    const W = Number(wslider.value); document.getElementById("window-val").textContent = W;
    let used = 0; const visible = new Array(CONVO.length).fill(false);
    for(let i=CONVO.length-1;i>=0;i--){ if(used + CONVO[i][2] <= W){ used += CONVO[i][2]; visible[i]=true; } else break; }
    const list = document.getElementById("convo"); list.replaceChildren();
    CONVO.forEach(([who,text,tok],i)=>{
      const li = el("li","msg "+(who==="You"?"user":"ai")+(visible[i]?"":" gone"));
      li.append(el("span","msg-who",who), el("span","msg-text",text), el("span","msg-tok",tok+" example tokens"+(visible[i]?"":" · out of view")));
      list.append(li);
    });
    const note = document.getElementById("window-note");
    if(!visible[0]){
      note.textContent = `Using ${used} of ${W} tokens. The first instruction is now out of view: the model can no longer “see” that donors must stay anonymous, so it might name them in the next draft.`;
      note.classList.add("warn"); mark("window");
    } else { note.textContent = `Using ${used} of ${W} tokens. Everything fits, so the model can see your original instructions.`; note.classList.remove("warn"); }
  }
  wslider.addEventListener("input",drawWindow);
  drawWindow();
})();
