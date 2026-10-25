"use strict";
/* Lesson 07 labs: grading exercise with a reference rubric, and an in-browser input guardrail
   (pattern matching for personal data with a real NHS-number check digit, injection and medical-advice flags). */
(function(){
  const {el, mark} = window.CWI;

  /* ---------- Be the evaluator ---------- */
  const CRIT=["Accurate","Answers the question","Safe"];
  const ANSWERS=[
    {t:"Yes for communication: in a six-month pilot of 120 adults with MND, 68% said the app helped them communicate with family. The pilot didn't measure effects on disease progression.",
     key:[1,1,1], why:"Faithful to the source, answers the question, and is honest about what the study didn't test."},
    {t:"Yes, 86% of users said the app helped, and it also slowed disease progression.",
     key:[0,1,0], why:"Wrong figure (86% instead of 68%) and an invented health claim. Misleading claims about a serious illness are a safety failure."},
    {t:"The pilot ran for six months and included 120 adults.",
     key:[1,0,1], why:"True, but it doesn't say whether the app helped."},
    {t:"Yes. People with MND should stop using their current communication aids and switch to this app.",
     key:[0,1,0], why:"The source says nothing like this. Telling people to stop using their aids could cause real harm."},
  ];
  const grades=ANSWERS.map(()=>[null,null,null]); let revealed=false;
  const gbox=document.getElementById("grade");
  function drawGrade(){
    gbox.replaceChildren();
    ANSWERS.forEach((a,i)=>{
      const card=el("div","grade-card");card.append(el("p","grade-answer",`Answer ${String.fromCharCode(65+i)}: “${a.t}”`));
      const row=el("div","grade-row");
      CRIT.forEach((c,j)=>{
        const g=el("div","grade-crit");g.setAttribute("role","group");g.setAttribute("aria-label",`${c}, answer ${String.fromCharCode(65+i)}`);
        g.append(el("span","grade-name",c));
        ["Pass","Fail"].forEach((lbl,v)=>{const val=v===0?1:0;
          const b=el("button","rate-btn "+(val?"pass":"fail"),lbl);b.type="button";b.setAttribute("aria-pressed",String(grades[i][j]===val));
          b.addEventListener("click",()=>{grades[i][j]=val;drawGrade();gbox.querySelectorAll(".grade-card")[i].querySelectorAll(".grade-crit")[j].querySelectorAll(".rate-btn")[v].focus();});
          g.append(b);});
        if(revealed){const ok=grades[i][j]===a.key[j];g.append(el("span","grade-key "+(ok?"agree":"differ"),(a.key[j]?"Our grade: Pass":"Our grade: Fail")+(grades[i][j]===null?"":ok?" ✓":" ✗")));}
        row.append(g);
      });
      card.append(row);
      if(revealed) card.append(el("p","fit-feedback",a.why));
      gbox.append(card);
    });
  }
  document.getElementById("reveal-btn").addEventListener("click",()=>{
    revealed=true;drawGrade();
    const total=ANSWERS.length*CRIT.length, done=grades.flat().filter(g=>g!==null).length;
    const agree=grades.reduce((n,g,i)=>n+g.filter((v,j)=>v===ANSWERS[i].key[j]).length,0);
    document.getElementById("grade-status").textContent=`You agreed with our reviewers on ${agree} of ${total} grades`+(done<total?` (${total-done} left blank)`:"")+". Where you differed, would a clearer rubric help?";
    mark("evaluate");
  });
  drawGrade();

  /* ---------- Guardrail ---------- */
  const nhsValid=d=>{const s=[...d].slice(0,9).reduce((a,c,i)=>a+Number(c)*(10-i),0);let c=11-s%11;if(c===11)c=0;return c!==10&&c===Number(d[9]);};
  const CHECKS=[
    {name:"Email address", kind:"redact", tag:"[EMAIL]", re:/[\w.+-]+@[\w-]+(\.[\w-]+)+/g},
    {name:"UK mobile number", kind:"redact", tag:"[PHONE]", re:/(?:\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b/g},
    {name:"NHS number", kind:"redact", tag:"[NHS NUMBER]", re:/\b\d{3}\s?\d{3}\s?\d{4}\b/g,
     note:m=>nhsValid(m.replace(/\s/g,""))?"valid check digit":"check digit doesn't match; possibly mistyped, but redacted anyway"},
    {name:"UK postcode", kind:"redact", tag:"[POSTCODE]", re:/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi},
    {name:"Date (possible date of birth)", kind:"redact", tag:"[DATE]", re:/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g},
  ];
  const FLAGS=[
    {name:"Prompt injection attempt", kind:"block", re:/\b(ignore|disregard|forget)\b.{0,20}\b(previous|prior|above|earlier|all)\b.{0,15}\b(instructions?|rules|prompts?)\b|\byou are now\b|\breveal (your|the) (system )?prompt\b/i,
     action:"Blocked: the message tries to override the assistant's instructions."},
    {name:"Request for medical advice", kind:"route", re:/\b(dose|dosage|diagnos\w*|prescri\w*|(stop|start) taking|side effects?|medication)\b/i,
     action:"Routed to a person: medical questions should be answered by a doctor, nurse or pharmacist."},
    {name:"Safeguarding concern", kind:"route", re:/\b(abuse|neglect|self[- ]harm|unsafe at home|being hurt)\b/i,
     action:"Routed to the safeguarding lead, following the charity's safeguarding policy."},
  ];
  document.getElementById("guard-btn").addEventListener("click",()=>{
    let text=document.getElementById("guard-input").value; const found=[];
    CHECKS.forEach(c=>{text=text.replace(c.re,m=>{found.push({c,m,note:c.note?c.note(m):""});return c.tag;});});
    const original=document.getElementById("guard-input").value;
    const flags=FLAGS.filter(f=>f.re.test(original));
    const out=document.getElementById("guard-out");out.replaceChildren();
    const list=el("ul","flags");
    if(!found.length&&!flags.length) list.append(el("li","flag warn","No configured patterns matched. This does not establish that the message is safe or free of personal data."));
    found.forEach(f=>list.append(el("li","flag warn",`Redacted ${f.c.name}: “${f.m}”${f.note?" ("+f.note+")":""}`)));
    flags.forEach(f=>list.append(el("li","flag "+(f.kind==="block"?"bad":"ok"),`${f.name}: ${f.action}`)));
    out.append(el("h3","mini-h","Guardrail results"),list);
    const blocked=flags.some(f=>f.kind==="block"), routed=flags.some(f=>f.kind==="route");
    out.append(el("h3","mini-h",blocked?"Message blocked":routed?"Held for a person to review":"Example text after pattern matching"));
    out.append(el("pre","prompt-box short",blocked?"(No model payload. The message was blocked.)":routed?"(No model payload. A flagged request needs review by the appropriate person.)":text));
    out.append(el("p","hint","Nothing is sent by this demo. These patterns miss names, addresses and indirect identifiers, and may flag harmless text. The displayed text is not certified safe to send."));
    mark("guard");
  });
})();
