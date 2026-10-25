"use strict";
/* Lesson 04 labs: real cosine similarity over hand-built 5-dimensional vectors; keyword overlap search for comparison. */
(function(){
  const {el, mark} = window.CWI;
  // dimensions: volunteering, money, research, health, events
  const TOPICS = {vol:["Volunteering","#C2453D"], money:["Fundraising","#B07A1E"], research:["Research","#102033"], health:["Health & care","#2F7A5C"], events:["Events","#6A5AA8"]};
  const DOCS = [
    {t:"Giving up your Saturday to help at the food bank", s:"Food bank Saturdays", v:[.9,0,0,.2,.3], topic:"vol", x:60, y:55},
    {t:"Joining our team of helpers", s:"Join our helpers", v:[.95,0,0,.1,.1], topic:"vol", x:95, y:100},
    {t:"Sharing your skills with a local charity", s:"Share your skills", v:[.85,.1,.1,.1,0], topic:"vol", x:60, y:145},
    {t:"Running a marathon for charity", s:"Charity marathon", v:[.2,.8,0,.2,.7], topic:"money", x:370, y:165},
    {t:"Setting up a monthly direct debit donation", s:"Monthly direct debit", v:[0,.95,0,.05,0], topic:"money", x:270, y:45},
    {t:"Gift Aid on your donation", s:"Gift Aid", v:[0,.9,0,0,0], topic:"money", x:250, y:95},
    {t:"Clinical trial results for a new MND drug", s:"MND drug trial", v:[0,0,.9,.6,0], topic:"research", x:440, y:262},
    {t:"Analysing patient data to find early signs of disease", s:"Early signs in data", v:[.05,0,.85,.5,0], topic:"research", x:470, y:315},
    {t:"Peer-reviewed study on dementia risk", s:"Dementia study", v:[0,0,.9,.5,0], topic:"research", x:440, y:365},
    {t:"Support for carers looking after a family member", s:"Support for carers", v:[.35,0,0,.9,0], topic:"health", x:60, y:262},
    {t:"Managing anxiety and low mood", s:"Anxiety & low mood", v:[0,0,.25,.85,0], topic:"health", x:60, y:362},
    {t:"Physiotherapy at home after a stroke", s:"Home physiotherapy", v:[0,0,.3,.8,.1], topic:"health", x:110, y:312},
    {t:"Summer garden party tickets", s:"Garden party", v:[.1,.4,0,0,.9], topic:"events", x:545, y:55},
    {t:"Charity quiz night at the village hall", s:"Quiz night", v:[.2,.4,0,0,.9], topic:"events", x:595, y:125},
  ];
  const QUERIES = [
    {q:"people offering their time", v:[.95,0,0,.1,.1], x:215, y:195, ly:222},
    {q:"ways to donate money", v:[0,.95,0,0,.1], x:300, y:230, ly:257},
    {q:"latest medical research", v:[0,0,.95,.4,0], x:320, y:315, ly:343},
    {q:"help for someone caring for a relative", v:[.3,0,0,.95,0], x:250, y:225, ly:206},
    {q:"fun fundraising events", v:[.1,.6,0,0,.85], x:490, y:195, ly:222},
  ];
  const CMP = [
    {q:"people offering their time", v:[.95,0,0,.1,.1], note:"This exact-word matcher finds nothing: no text uses these words. Our hand-set vectors rank the volunteering texts highly."},
    {q:"help for someone caring for a relative", v:[.3,0,0,.95,0], note:"Keyword search latches on to the word “help” and returns the food bank. This exact-word matcher treats “caring” and “carers” as different words. Our hand-set vectors rank the carers text higher. Real keyword systems can use stemming or synonyms to improve matches."},
    {q:"Gift Aid", v:[0,.9,0,0,0], note:"An exact scheme name: keyword search goes straight to it. Meaning search also ranks it first, but the other money texts score almost as highly."},
    {q:"MND drug trial", v:[0,0,.9,.6,0], note:"Acronyms and exact terms suit keyword search well. Real systems often combine both approaches. This is called hybrid search."},
  ];
  const cos = (a,b)=>{let d=0,na=0,nb=0;a.forEach((x,i)=>{d+=x*b[i];na+=x*x;nb+=b[i]*b[i];});return d/(Math.sqrt(na)*Math.sqrt(nb));};
  const rank = v => DOCS.map(d=>({d,s:cos(v,d.v)})).sort((a,b)=>b.s-a.s);
  const SVGNS="http://www.w3.org/2000/svg";
  const svg = document.getElementById("map");
  const node=(tag,attrs,txt)=>{const n=document.createElementNS(SVGNS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(txt)n.textContent=txt;return n;};

  function drawMap(qi){
    svg.replaceChildren();
    const q = qi===null?null:QUERIES[qi], ranked = q?rank(q.v):[];
    let qx=0,qy=0;
    if(q){ // hand-placed in open space near its closest texts, so labels never collide
      qx=q.x; qy=q.y;
      ranked.slice(0,3).forEach(r=>svg.append(node("line",{x1:qx,y1:qy,x2:r.d.x,y2:r.d.y,class:"map-link"})));
    }
    Object.keys(TOPICS).forEach(t=>{ // soft halo behind each topic group
      const ds=DOCS.filter(d=>d.topic===t); if(!ds.length) return;
      const cx=ds.reduce((a,d)=>a+d.x,0)/ds.length, cy=ds.reduce((a,d)=>a+d.y,0)/ds.length;
      const r=Math.max(...ds.map(d=>Math.hypot(d.x-cx,d.y-cy)))+30;
      svg.insertBefore(node("circle",{cx,cy,r,fill:TOPICS[t][1],class:"map-halo"}),svg.firstChild);
    });
    const hits=q?ranked.slice(0,3).map(r=>r.d):[];
    DOCS.forEach(d=>{
      const g=node("g",{class:"map-dot"+(hits.includes(d)?" hit":q?" dim":"")});
      g.append(node("circle",{cx:d.x,cy:d.y,r:8,fill:TOPICS[d.topic][1]}));
      const anchor=d.x>500?"end":"start", dx=d.x>500?-12:12;
      g.append(node("text",{x:d.x+dx,y:d.y+4,"text-anchor":anchor},d.s));
      svg.append(g);
    });
    if(q){
      svg.append(node("path",{d:star(qx,qy,13,6),class:"map-star"}));
      svg.append(node("text",{x:qx,y:q.ly,class:"map-qlabel","text-anchor":"middle"},"“"+q.q+"”"));
      const out=document.getElementById("sem-results"); out.replaceChildren();
      ranked.slice(0,3).forEach(r=>{const li=el("li");li.append(el("span",null,r.d.t),el("b","score",r.s.toFixed(2)));out.append(li);});
      mark("map");
    }
  }
  function star(cx,cy,R,r){let p="";for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,rad=i%2?r:R;p+=(i?"L":"M")+(cx+rad*Math.cos(a)).toFixed(1)+","+(cy+rad*Math.sin(a)).toFixed(1);}return p+"Z";}

  function chips(boxId,list,onPick){
    const box=document.getElementById(boxId);
    list.forEach((q,i)=>{const b=el("button","chip","“"+q.q+"”");b.type="button";b.setAttribute("aria-pressed","false");
      b.addEventListener("click",()=>{box.querySelectorAll(".chip").forEach((c,j)=>c.setAttribute("aria-pressed",String(i===j)));onPick(i);});box.append(b);});
  }
  const leg=document.getElementById("legend");
  Object.values(TOPICS).forEach(([n,c])=>{const s=el("span","legend-item");const dot=el("i");dot.style.background=c;s.append(dot,document.createTextNode(n));leg.append(s);});
  chips("queries",QUERIES,drawMap);
  drawMap(null);
  document.getElementById("sem-results").append(el("li","empty","Choose a question above."));

  /* ---------- Lab 2: keyword vs meaning ---------- */
  const STOP=new Set("a an the and or for to of in on at is are your our their my with from about up after new someone".split(" "));
  const terms=s=>s.toLowerCase().match(/[a-z]+/g).filter(w=>!STOP.has(w));
  chips("cmp-queries",CMP,i=>{
    const c=CMP[i], qt=new Set(terms(c.q));
    const kw=DOCS.map(d=>{const hit=terms(d.t).filter(w=>qt.has(w));return {d,s:new Set(hit).size,hit:[...new Set(hit)]};}).filter(r=>r.s>0).sort((a,b)=>b.s-a.s).slice(0,3);
    const kwOut=document.getElementById("kw-out"); kwOut.replaceChildren();
    if(!kw.length) kwOut.append(el("li","empty","No results. None of the words matched."));
    kw.forEach(r=>{const li=el("li");li.append(el("span",null,r.d.t),el("b","score","matched: "+r.hit.join(", ")));kwOut.append(li);});
    const mOut=document.getElementById("mean-out"); mOut.replaceChildren();
    rank(c.v).slice(0,3).forEach(r=>{const li=el("li");li.append(el("span",null,r.d.t),el("b","score",r.s.toFixed(2)));mOut.append(li);});
    document.getElementById("cmp-note").textContent=c.note;
    mark("compare");
  });
})();
