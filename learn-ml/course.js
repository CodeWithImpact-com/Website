'use strict';
const ML_LESSONS = [
 {id:'framing',title:'Start with a useful question',description:'Choose the right kind of problem and write a brief connecting a prediction to a decision.',time:10,tag:'Problem framing'},
 {id:'data',title:'Know what your data knows',description:'Inspect unusual values, missing information and biased samples before checking for leakage.',time:15,tag:'Data & sampling'},
 {id:'regression',title:'Predict a number',description:'Fit a line, inspect residuals and see why estimates change across samples.',time:15,tag:'Regression & uncertainty'},
 {id:'classification',title:'Choose your trade-off',description:'Change a threshold, then explore why rare outcomes change precision.',time:15,tag:'Classification'},
 {id:'overfitting',title:'When learning becomes memorising',description:'Compare model complexity, training-set size and regularisation on separate examples.',time:15,tag:'Generalisation'},
 {id:'comparison',title:'Give every model a fair test',description:'Compare shared validation folds, then lock a choice before the final test.',time:15,tag:'Model selection'},
 {id:'clustering',title:'Find groups, then question them',description:'Explore k-means and ask when a mathematical grouping is useful.',tag:'Clustering',planned:true},
 {id:'ensembles',title:'From a tree to a team of models',description:'Follow a decision path, then explore forests and boosting.',tag:'Trees & ensembles',planned:true},
 {id:'explain',title:'Why did it predict that?',description:'Explore feature importance and simple explanations, and what they can’t tell you.',tag:'Explaining predictions',planned:true},
 {id:'fairness',title:'Does it work for everyone?',description:'Compare errors across groups and decide what a fair result looks like.',tag:'Fairness',planned:true},
 {id:'forecasting',title:'Predict the days ahead',description:'Split by time, use a seasonal baseline and test on the future, not the past.',tag:'Forecasting',planned:true},
 {id:'capstone',title:'Build a project with purpose',description:'Write a question, establish a baseline and explain when your model fails.',tag:'Impact project',planned:true}
];
let mlProgress=[];
try{const saved=JSON.parse(localStorage.getItem('cwi-ml-v7')||'[]');if(Array.isArray(saved))mlProgress=saved.filter(id=>ML_LESSONS.slice(0,6).some(l=>l.id===id));}catch{}
function mlRenderPath() {
 const root=document.getElementById('course-path');
 if(!root)return;
 root.innerHTML=[0,6].map((start,i)=>`<div class="ml-path-stage"><h3>${i?'02 / Go further':'01 / Build your foundations'}</h3><span>${i?'Proposed next stage':'Six lessons · About 85 minutes'}</span></div><div class="ml-lessons">${ML_LESSONS.slice(start,start+6).map((l,j)=>`<article class="ml-lesson-card ${l.planned?'planned':''}"><div class="ml-card-top"><span class="ml-lesson-number">${String(start+j+1).padStart(2,'0')}</span><span class="ml-tag ${l.planned?'':'live'}">${l.planned?'In the plan':mlProgress.includes(l.id)?'Completed ✓':'Ready to explore'}</span></div><h4>${l.title}</h4><p>${l.description}</p><div class="ml-card-bottom"><span>${l.time?l.time+' min · ':''}${l.tag}</span>${l.planned?`<a href="https://docs.google.com/forms/d/e/1FAIpQLSf5lx7s6qApnilmF91cXnFFweXpXip7QSle1LdDbivNnrTJNQ/viewform?usp=sharing&amp;ouid=109427088113351453508" target="_blank" rel="noopener noreferrer" data-cwi-analytics-event="notify-${l.id}" data-cwi-analytics-title="Notify me: ${l.title}" aria-label="Notify me when “${l.title}” is ready (opens a form in a new tab)">Notify me ↗</a>`:`<a href="lesson.html?lesson=${l.id}">Open lesson ↗</a>`}</div></article>`).join('')}</div>`).join('');
 document.getElementById('course-progress').textContent=`${new Set(mlProgress).size} of 6 lessons completed`;
 const next=ML_LESSONS.slice(0,6).find(l=>!mlProgress.includes(l.id));
 const resume=document.getElementById('resume-link');
 resume.textContent=next?(mlProgress.length?'Continue learning ↗':'Start lesson 1 ↗'):'Revisit the lessons ↗';
 resume.href=next?'lesson.html?lesson='+next.id:'#learning-path';
}
mlRenderPath();
const heroSlider=document.getElementById('hero-fit');
if(heroSlider){const points=[[10,25],[18,32],[29,48],[38,50],[47,73],[58,82],[67,103],[77,109],[87,131]];const render=()=>{const m=+heroSlider.value;const error=points.reduce((s,[x,y])=>s+Math.abs(y-(m*x+9)),0)/points.length;const x=v=>38+v*4.3,y=v=>211-v*1.12;document.getElementById('hero-chart').innerHTML='<title id="hero-chart-title">Synthetic visitor counts and meal demand; move the slider to adjust the prediction line</title><path d="M38 20V211H455" fill="none" stroke="#53647a"/>'+[40,80,120,160].map(v=>`<path d="M38 ${y(v)}H455" stroke="#283e54"/><text x="7" y="${y(v)+4}" fill="#aebdcc" font-size="9">${v}</text>`).join('')+`<path d="M${x(0)} ${y(9)}L${x(100)} ${y(m*100+9)}" stroke="#f5bd69" stroke-width="2.5"/>`+points.map(([a,b])=>`<circle cx="${x(a)}" cy="${y(b)}" r="5" fill="#ed7b74"/>`).join('')+'<text x="40" y="12" fill="#aebdcc" font-size="9">Meals needed</text><text x="315" y="233" fill="#aebdcc" font-size="9">Expected visitors →</text>';document.getElementById('hero-fit-value').textContent=m.toFixed(2)+' meals / visitor';document.getElementById('hero-feedback').textContent=`Average training error: ${error.toFixed(1)} meals. ${error<6?'A closer fit. How would it do on new days?':'Can you bring the line closer to the dots?'}`;};heroSlider.addEventListener('input',render);render();}
