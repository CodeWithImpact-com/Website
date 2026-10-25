"use strict";
/* Resources page: filter cards by level. */
(function(){
  const chips=[...document.querySelectorAll("#level-filter .chip")], cards=[...document.querySelectorAll(".res-card")];
  chips.forEach(c=>c.addEventListener("click",()=>{
    const lvl=c.dataset.level;
    chips.forEach(x=>x.setAttribute("aria-pressed",String(x===c)));
    let n=0; cards.forEach(card=>{const show=lvl==="all"||card.dataset.level===lvl;card.hidden=!show;if(show)n++;});
    document.querySelectorAll(".res-grid").forEach(g=>{const any=[...g.children].some(x=>!x.hidden);g.hidden=!any;g.previousElementSibling.hidden=!any;g.previousElementSibling.previousElementSibling.hidden=!any;});
    document.getElementById("filter-status").textContent=lvl==="all"?"":`Showing ${n} ${lvl.toLowerCase()} resources.`;
  }));
})();
