"use strict";
/* Lesson 05 lab: real sentence chunking + BM25 retrieval over five fictional policy documents.
   Final answers are pre-written, but WHICH answer appears depends on what retrieval actually found. */
(function(){
  const {el, mark, setupTabs} = window.CWI;
  const DOCS = [
    {id:"handbook", name:"Volunteer handbook", s:[
      "Volunteers must complete an induction session before their first shift.",
      "Inductions run on the first Tuesday of every month at the Riverside Centre.",
      "Every new volunteer is paired with a buddy for their first three shifts.",
      "Shifts are booked through the online rota, which opens two weeks in advance.",
      "If you cannot attend a shift, tell the volunteer coordinator at least 24 hours beforehand."]},
    {id:"expenses", name:"Expenses policy", s:[
      "Volunteers can claim travel expenses for journeys to and from their shift.",
      "Mileage is paid at 45p per mile for car journeys.",
      "Public transport fares are reimbursed in full when a receipt is provided.",
      "Claims must be submitted within 30 days using the expenses form.",
      "Meals are only reimbursed for shifts longer than six hours, up to £8."]},
    {id:"data", name:"Data protection guidance", s:[
      "Never take photos of service users without written consent.",
      "Personal information must only be stored on charity-approved systems.",
      "Do not paste names, addresses or health details into public AI tools.",
      "If personal data is lost or shared by mistake, report it to the data protection lead within 24 hours.",
      "The data protection lead is Sam Okafor, who can be reached on extension 214."]},
    {id:"research", name:"Research partnership FAQ", s:[
      "The Trust shares anonymised service data with university research partners.",
      "Researchers must have ethical approval before any data is shared.",
      "Removing names, dates of birth and postcodes is one step; the data team also checks whether remaining details could identify someone.",
      "Service users can opt out of research at any time by contacting the office."]},
    {id:"events", name:"Event safety checklist", s:[
      "Every public event needs a named first aider on site.",
      "Risk assessments must be signed off by the events manager two weeks before the event.",
      "Outdoor events need a wet-weather plan.",
      "Volunteers under 18 must be supervised by a named adult at all times."]},
  ];
  // Each question: sentences needed for a full answer (doc:index), and answer variants.
  const QS = [
    {q:"How much can I claim for driving to my shift?", need:["expenses:1"], bonus:"expenses:3",
     full:c=>`You can claim 45p per mile for car journeys to and from your shift ${c("expenses:1")}.` ,
     extra:c=>` Submit the claim within 30 days using the expenses form ${c("expenses:3")}.`,
     partial:{has:"expenses:0", text:c=>`You can claim travel expenses for journeys to and from your shift ${c("expenses:0")}, but the retrieved text doesn't say what the mileage rate is.`},
     none:"I can't find the mileage rate in the documents I was given. Please check the expenses policy or ask the volunteer coordinator.",
     norag:"Most charities reimburse mileage at around 25p per mile, so you can expect something similar. Check with your manager for details."},
    {q:"Can I paste notes about service users into an AI tool?", need:["data:2"], bonus:"data:1",
     full:c=>`No, not if the notes contain names, addresses or health details. These must not be pasted into public AI tools ${c("data:2")}.`,
     extra:c=>` Personal information should only be stored on charity-approved systems ${c("data:1")}.`,
     none:"I can't find guidance on this in the documents I was given. Please ask the data protection lead before using an AI tool with personal information.",
     norag:"Yes, AI tools like ChatGPT are a great way to summarise notes quickly. Just paste the notes in and ask for a summary."},
    {q:"Who do I report to if personal data is lost?", need:["data:3"], bonus:"data:4",
     full:c=>`Report it to the data protection lead within 24 hours ${c("data:3")}.`,
     extra:c=>` The data protection lead is Sam Okafor, on extension 214 ${c("data:4")}.`,
     fullNoBonus:" The retrieved text doesn't say who the data protection lead is.",
     none:"I can't find the reporting process in the documents I was given.",
     norag:"Contact your IT helpdesk as soon as possible and consider reporting it to the police."},
    {q:"When is the next volunteer induction?", need:["handbook:1"], bonus:"handbook:0",
     full:c=>`Inductions run on the first Tuesday of every month at the Riverside Centre ${c("handbook:1")}.`,
     extra:c=>` You need to complete one before your first shift ${c("handbook:0")}.`,
     none:"I can't find induction dates in the documents I was given.",
     norag:"Inductions are usually held on your first day of volunteering, so just turn up to your first shift."},
  ];
  const STOP=new Set("a an the and or of to in on at for is are be by i my me can do does if it its this that who what when how much with from into before about their our you your will must only any every".split(" "));
  const stem=w=>w.length>4&&w.endsWith("s")&&!w.endsWith("ss")?w.slice(0,-1):w;
  const terms=s=>(s.toLowerCase().match(/[a-z0-9£]+/g)||[]).filter(w=>!STOP.has(w)).map(stem);

  let qi=null, stage=0;
  const sizeIn=document.getElementById("chunk-size"), kIn=document.getElementById("topk"), panel=document.getElementById("rag-panel");

  function chunks(){
    const size=Number(sizeIn.value), out=[];
    DOCS.forEach(d=>{for(let i=0;i<d.s.length;i+=size){const ids=[];for(let j=i;j<Math.min(i+size,d.s.length);j++)ids.push(d.id+":"+j);
      out.push({doc:d,ids,text:d.s.slice(i,i+size).join(" ")});}});
    out.forEach((c,i)=>{c.n=i+1;c.t=terms(c.text);});
    return out;
  }
  function bm25(cs,query){
    const N=cs.length, avg=cs.reduce((a,c)=>a+c.t.length,0)/N, k1=1.2, b=0.75, qt=[...new Set(terms(query))];
    const df={}; qt.forEach(t=>df[t]=cs.filter(c=>c.t.includes(t)).length);
    return cs.map(c=>{let s=0;const hit=[];qt.forEach(t=>{const tf=c.t.filter(x=>x===t).length;if(!tf)return;hit.push(t);
      const idf=Math.log(1+(N-df[t]+.5)/(df[t]+.5));s+=idf*tf*(k1+1)/(tf+k1*(1-b+b*c.t.length/avg));});return {c,s,hit};})
      .sort((a,b)=>b.s-a.s);
  }
  function retrieved(){const cs=chunks();return {cs, ranked:bm25(cs,QS[qi].q), top:bm25(cs,QS[qi].q).filter(r=>r.s>0).slice(0,Number(kIn.value))};}

  function highlight(text,hit){
    const p=el("p","chunk-text");
    text.split(/(\s+)/).forEach(w=>{const t=stem((w.toLowerCase().match(/[a-z0-9£]+/)||[""])[0]);
      if(hit.includes(t)&&t){p.append(el("mark",null,w));}else p.append(document.createTextNode(w));});
    return p;
  }

  function draw(){
    panel.replaceChildren();
    document.getElementById("chunk-val").textContent=sizeIn.value;
    document.getElementById("topk-val").textContent=kIn.value;
    if(qi===null){panel.append(el("p","empty-note","Choose a question above to start."));return;}
    const Q=QS[qi], {cs, ranked, top}=retrieved();
    const got=new Set(top.flatMap(r=>r.c.ids));
    const order=top.map(r=>r.c);
    const cite=id=>{const i=order.findIndex(c=>c.ids.includes(id));return i<0?"":`[${i+1}]`;};

    if(stage===0){
      panel.append(el("h3",null,`Stage 1: split ${DOCS.length} documents into ${cs.length} chunks`),
        el("p",null,"Long documents are split into smaller chunks so that only the relevant parts are sent to the model. Change the chunk size and watch the count change."));
      const grid=el("div","doc-grid");
      DOCS.forEach(d=>{const card=el("div","doc-card");card.append(el("h4",null,d.name));
        cs.filter(c=>c.doc===d).forEach(c=>{const ch=el("p","chunk");ch.append(el("b",null,"#"+c.n+" "),document.createTextNode(c.text));card.append(ch);});grid.append(card);});
      panel.append(grid); mark("chunk");
    }
    if(stage===1){
      panel.append(el("h3",null,"Stage 2: retrieve the most relevant chunks"),
        el("p",null,`Each chunk is scored against the question “${Q.q}” with BM25. Highlighted words are the matches. The top ${kIn.value} chunks are kept.`));
      const list=el("ol","ranked");
      ranked.slice(0,6).forEach((r,i)=>{const li=el("li",i<top.length?"kept":"dropped");
        const head=el("div","ranked-head");head.append(el("span",null,r.c.doc.name+" · chunk #"+r.c.n),el("b","score",r.s.toFixed(2)),el("span","ranked-tag",i<top.length?"kept":"not sent"));
        li.append(head,highlight(r.c.text,r.hit));list.append(li);});
      panel.append(list); mark("retrieve");
    }
    if(stage===2){
      panel.append(el("h3",null,"Stage 3: augment the prompt"),
        el("p",null,"The retrieved chunks are pasted into the prompt, numbered so the model can cite them, with instructions to stay within the sources."));
      const text="Answer the question using only the sources below.\nCite sources like [1]. If the answer is not in the sources, say you can't find it.\n\nSources:\n"
        +order.map((c,i)=>`[${i+1}] (${c.doc.name}) ${c.text}`).join("\n")+`\n\nQuestion: ${Q.q}`;
      panel.append(el("pre","prompt-box",text));
    }
    if(stage===3){
      panel.append(el("h3",null,"Stage 4: generate a grounded answer"));
      const has=Q.need.every(id=>got.has(id));
      let ans;
      if(has){ ans=Q.full(cite)+(got.has(Q.bonus)?Q.extra(cite):(Q.fullNoBonus||"")); }
      else if(Q.partial&&got.has(Q.partial.has)){ ans=Q.partial.text(cite); }
      else ans=Q.none;
      const box=el("div","answer-box "+(has?"good":"weak"));
      box.append(el("p","answer-label","Scripted example with retrieved context"),el("p",null,ans));
      box.append(el("p","answer-note",has?"The key sentence was retrieved. This scripted answer uses it and adds a citation; a real model could still misread the source."
        :"The key sentence was not retrieved. This scripted example declines to guess. A real model may still invent an answer, so test this behaviour. Try a larger chunk size or top-k."));
      panel.append(box);
      const nb=el("button","btn secondary small","Compare: answer without RAG");nb.type="button";nb.id="norag";
      nb.addEventListener("click",()=>{if(panel.querySelector(".answer-box.bad"))return;
        const bad=el("div","answer-box bad");bad.append(el("p","answer-label","Scripted failure without retrieved context"),el("p",null,Q.norag),
          el("p","answer-note","✗ Fluent and confident, but not based on the Trust's policies."));panel.append(bad);mark("norag");});
      panel.append(nb); mark("generate");
    }
  }
  const select=setupTabs(document.querySelector('[aria-label="RAG pipeline stages"]'),i=>{stage=i;draw();});
  const qbox=document.getElementById("rag-questions");
  QS.forEach((Q,i)=>{const b=el("button","chip",Q.q);b.type="button";b.setAttribute("aria-pressed","false");
    b.addEventListener("click",()=>{qi=i;qbox.querySelectorAll(".chip").forEach((c,j)=>c.setAttribute("aria-pressed",String(i===j)));draw();});qbox.append(b);});
  sizeIn.addEventListener("input",draw); kIn.addEventListener("input",draw);
  draw();
})();
