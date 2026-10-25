"use strict";
/* Learning path on learn/index.html: builds the module cards for the chosen track
   and shows "Completed" for lessons finished in this browser. */
const lessons=[
 {n:1,stage:"FOUNDATIONS",title:"AI Made Simple",detail:"What AI is, how it learns from examples, and what it can and cannot do.",minutes:15,explore:true,url:"ai-made-simple.html"},
 {n:2,stage:"FOUNDATIONS",title:"Inside an LLM",detail:"Explore tokens, vectors, attention and next-token prediction.",minutes:20,explore:true,url:"inside-an-llm.html"},
 {n:3,stage:"FOUNDATIONS",title:"Prompting & Context",detail:"Write clear prompts, and see how context and temperature change answers.",minutes:20,explore:true,url:"prompting-and-context.html"},
 {n:4,stage:"BUILDING BLOCKS",title:"Embeddings & Search",detail:"Discover how meaning becomes numbers, and how similarity search works.",minutes:25,explore:false,url:"embeddings-and-search.html"},
 {n:5,stage:"BUILDING BLOCKS",title:"Build a RAG System",detail:"Chunk, retrieve and ground answers in your own documents.",minutes:30,explore:false,url:"build-a-rag-system.html"},
 {n:6,stage:"BUILDING BLOCKS",title:"AI Agents",detail:"Tools, memory, planning and keeping a human in control.",minutes:30,explore:false,url:"ai-agents.html"},
 {n:7,stage:"RESPONSIBLE AI",title:"Evaluation & Safety",detail:"Test answers against evidence and add guardrails.",minutes:25,explore:true,url:"evaluation-and-safety.html"}
];
const box=document.getElementById("module-container"),help=document.getElementById("track-help");
function isDone(l){try{return localStorage.getItem("cwi-learn-"+(l.slug||l.url.replace(".html","")))==="complete";}catch(_e){return false;}}
function render(track){
  const selected=lessons.filter(l=>track==="builder"||l.explore);
  box.replaceChildren();
  const grid=document.createElement("div");grid.className="module-grid";box.append(grid);
  selected.forEach(l=>{
    const done=isDone(l);
    const el=document.createElement("article");el.className="module live"+(done?" done":"");
    const head=document.createElement("div");head.className="module-number";
    const no=document.createElement("span");no.className="number";no.textContent=String(l.n).padStart(2,"0");
    const tag=document.createElement("span");tag.className="pill";tag.textContent=done?"Completed ✓":"Interactive";
    head.append(no,tag);
    const st=document.createElement("p");st.className="module-stage";st.textContent=l.stage.toLowerCase().replace(/^./,c=>c.toUpperCase());
    const h=document.createElement("h3");h.textContent=l.title;
    const desc=document.createElement("p");desc.textContent=l.detail;
    const bottom=document.createElement("div");bottom.className="module-bottom";
    const duration=document.createElement("span");duration.textContent=`About ${l.minutes} min`;
    const action=document.createElement("a");action.href=l.url;action.textContent=done?"Review →":"Start lesson →";
    action.setAttribute("aria-label",`${done?"Review":"Start"} lesson ${l.n}: ${l.title}`);
    bottom.append(duration,action);el.append(head,st,h,desc,bottom);grid.append(el);
  });
  const total=selected.reduce((s,l)=>s+l.minutes,0), done=selected.filter(isDone).length;
  help.textContent=`${track==="builder"?"Build AI track":"Explore AI track"} · ${selected.length} lessons · about ${Math.round(total/30)/2} hours`+(done?` · ${done} completed`:"");
  document.querySelectorAll("[data-track]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.track===track)));
}
document.querySelectorAll("[data-track]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.track)));
render("builder");
