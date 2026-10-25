"use strict";
/* Lesson 02: curated worked examples, not language-model inference.
   All token splits, initial vectors, attention weights and probabilities are hand-authored. */
(function(){
  const {el, mark} = window.CWI;
  const demo = document.getElementById("demo");
  const caption = document.getElementById("stage-caption");
  const buttons = document.getElementById("sentence-examples");
  const preview = document.getElementById("sentence-preview");

  // Repeated token text has the same initial embedding across these examples.
  // These three coordinates have no assigned semantic meaning.
  const VECTORS = {
    The:[0.2,-0.1,0.4], charity:[0.8,0.3,-0.2], team:[0.5,0.6,0.1],
    reviewed:[-0.3,0.7,0.5], the:[0.1,-0.2,0.3], research:[0.6,0.2,0.9],
    analysed:[-0.1,0.8,0.7], planned:[0.4,0.7,-0.1], a:[0.1,-0.3,0.2],
    fund:[0.7,0.3,0.2], raising:[0.6,0.4,-0.2]
  };
  const EXAMPLES = [
    {
      label:"Charity review", prefix:"The charity team reviewed the",
      tokens:["The","charity","team","reviewed","the"],
      attention:[[100],[20,80],[10,50,40],[5,20,25,50],[5,20,20,45,10]],
      predictions:[["report",44],["budget",28],["proposal",18],["rota",10]],
      focus:"In the last row, “reviewed” has the largest weight. The charity and team tokens also contribute. These weights were chosen to illustrate how earlier context can be combined.",
      note:"“Reviewed” suggests something the team can read or assess. These four continuations fit this example, but the ranking is a teaching choice."
    },
    {
      label:"Research analysis", prefix:"The research team analysed the",
      tokens:["The","research","team","analysed","the"],
      attention:[[100],[20,80],[10,50,40],[5,25,20,50],[5,30,15,40,10]],
      predictions:[["data",52],["samples",26],["results",16],["report",6]],
      focus:"In the last row, “research” and “analysed” receive most of the weight. Compare this with the charity example: the final token is still “the”, but its context is different.",
      note:"The final token matches the charity example, but “research” and “analysed” suggest different continuations. Real models use the preceding context too."
    },
    {
      label:"Fundraising plan", prefix:"The team planned a fundraising",
      tokens:["The","team","planned","a","fund","raising"],
      attention:[[100],[20,80],[10,30,60],[5,15,30,50],[5,10,20,10,55],[5,10,20,5,30,30]],
      predictions:[["event",52],["campaign",28],["appeal",12],["dinner",8]],
      focus:"The last row combines the two pieces “fund” and “raising” with the earlier planning context. No row can use tokens that come after it.",
      note:"This example splits “fundraising” into two pieces. A next token can complete the phrase in several ways; “event” is one possible continuation."
    }
  ];
  let exampleIndex = 0, stage = 0;

  function tokens(example){
    demo.append(el("h3",null,"Stage 1: tokenisation"), el("p",null,
      "A tokeniser divides text into units from its vocabulary. Our worked examples use the splits below; a real tokeniser may divide them differently."));
    const row = el("div","tokens");
    example.tokens.forEach((text,i)=>{
      const token = el("span","token",`${i+1}. ${text}`);
      token.setAttribute("aria-label",`Position ${i+1}: ${text}`);
      row.append(token);
    });
    demo.append(row, el("span","demo-label",`${example.tokens.length} tokens in this worked example`));
    caption.textContent = exampleIndex===2
      ? "One word can span more than one token: here we chose “fund” + “raising”."
      : "The numbers show positions in the sequence. Token splits depend on the tokeniser.";
  }

  function vectors(example){
    demo.append(el("h3",null,"Stage 2: initial token embeddings"), el("p",null,
      "Each token starts with a numerical vector. We show three invented coordinates per token. Repeated tokens start with the same embedding; position and context affect the representations as the transformer processes them."));
    const row = el("div","vector-grid");
    example.tokens.forEach((text,i)=>{
      const card = el("div","vector");
      card.append(el("b",null,`${i+1}. ${text}`),
        el("code",null,`[${VECTORS[text].map(n=>n.toFixed(1)).join(", ")}]`));
      row.append(card);
    });
    demo.append(row);
    caption.textContent = "Hand-set initial vectors, not learned model values. These coordinates do not measure meaning or confidence.";
  }

  function attention(example){
    demo.append(el("h3",null,"Stage 3: attention over earlier context"), el("p",null,
      "Read across a row to see how that position combines information from available tokens. Each row totals 100%. Future positions are masked; darker cells have larger weights."));
    const holder = el("div","heatmap"), table = el("table"), head = el("tr");
    const title = el("caption",null,"Hand-set causal attention weights; rows read from column positions.");
    head.append(el("th",null,"Row / column"));
    example.tokens.forEach((text,i)=>{
      const th = el("th",null,`${i+1}. ${text}`); th.setAttribute("scope","col"); head.append(th);
    });
    table.append(title, head);
    example.tokens.forEach((text,i)=>{
      const tr = el("tr"), th = el("th",null,`${i+1}. ${text}`); th.setAttribute("scope","row"); tr.append(th);
      example.tokens.forEach((_,j)=>{
        const weight = j<=i ? example.attention[i][j] : 0;
        const cell = el("td",null,j<=i ? weight+"%" : "masked");
        cell.style.backgroundColor = j<=i ? `rgba(237,123,116,${0.12+0.78*weight/100})` : "#f3ece2";
        tr.append(cell);
      });
      table.append(tr);
    });
    holder.append(table); demo.append(holder, el("p","hint",example.focus));
    caption.textContent = "This is a chosen attention pattern, not a measured attention map or a full account of model reasoning.";
  }

  function prediction(example){
    demo.append(el("h3",null,"Stage 4: possible next tokens"), el("p",null,example.note));
    const bars = el("div","bars");
    example.predictions.forEach(([text,probability])=>{
      const row = el("div","bar-row"), track = el("div","bar-track"), fill = el("div","fill");
      fill.style.width = probability+"%"; track.append(fill);
      row.append(el("span",null,text), track, el("span",null,probability+"%")); bars.append(row);
    });
    const continuation = el("p","notice");
    continuation.append(el("b",null,"One possible continuation: "),
      document.createTextNode(example.prefix+" "), el("mark",null,example.predictions[0][0]));
    demo.append(bars, el("span","demo-label","Hand-set probabilities for a four-choice example"), continuation);
    caption.textContent = "These four choices total 100% in our example. A real model scores its whole vocabulary; the token it chooses need not be the top one.";
  }

  function render(){
    const example = EXAMPLES[exampleIndex];
    preview.textContent = example.prefix+" …";
    [...buttons.children].forEach((button,i)=>button.setAttribute("aria-pressed",String(i===exampleIndex)));
    document.querySelectorAll("[data-stage]").forEach(button=>{
      const selected = Number(button.dataset.stage)===stage;
      button.setAttribute("aria-selected",String(selected)); button.tabIndex=selected?0:-1;
    });
    demo.replaceChildren(); demo.setAttribute("aria-labelledby","tab-"+stage);
    [tokens,vectors,attention,prediction][stage](example);
    document.getElementById("next-stage").textContent = stage===3 ? "Back to tokens ↺" : "Next stage →";
    mark("stage-"+stage);
  }

  EXAMPLES.forEach((example,i)=>{
    const button = el("button","chip",example.label); button.type="button";
    button.addEventListener("click",()=>{exampleIndex=i;render();}); buttons.append(button);
  });
  document.querySelectorAll("[data-stage]").forEach(button=>button.addEventListener("click",()=>{
    stage=Number(button.dataset.stage);render();
  }));
  document.querySelector(".stage-tabs").addEventListener("keydown",event=>{
    const direction={ArrowRight:1,ArrowLeft:3,Home:"first",End:"last"}[event.key];
    if(direction===undefined)return;
    event.preventDefault(); stage=direction==="first"?0:direction==="last"?3:(stage+direction)%4;
    render();document.getElementById("tab-"+stage).focus();
  });
  document.getElementById("next-stage").addEventListener("click",()=>{stage=(stage+1)%4;render();});
  render();
})();
