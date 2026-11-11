(function(){'use strict';
const d=window.INDOCHINA_DATA,sections=d.sections,bank=d.bank,templates=d.templates;
const $=id=>document.getElementById(id),pick=a=>a[Math.floor(Math.random()*a.length)];
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const family=q=>{let t=q.toLowerCase();return t.startsWith('assess the impact')?'impact':t.startsWith('assess')?'significance':t.startsWith('evaluate')?'effectiveness':t.startsWith('analyse')?'change':t.startsWith('compare')||t.startsWith('was ')?'comparison':t.startsWith('how accurate')?'judgement':t.startsWith('to what extent')?'causation':'other'};

function graphQuestions(){
 const output=[],seen=new Set();
 const add=(q,r,fam)=>{const norm=normalize(q);if(seen.has(norm))return;seen.add(norm);output.push({id:'graph-'+output.length,section:r.section,dotpoint:r.dotpoint,features:r.features,question:q,source:'generated',family:fam,relationship:r.id})};
 for(const r of d.relationships){
  for(const f of r.factors)for(const o of r.outcomes){
   add(`To what extent did ${f} contribute to ${o}?`,r,'causation');
   add(`Assess the significance of ${f} for ${o}.`,r,'significance');
   add(`How accurate is the view that ${f} was a decisive factor in ${o}?`,r,'judgement');
  }
  // Comparison is permitted only for factors sharing the same explicitly bounded outcome.
  for(let i=0;i<r.factors.length;i++)for(let j=i+1;j<r.factors.length;j++){
   add(`Assess the relative importance of ${r.factors[i]} and ${r.factors[j]} in shaping ${r.outcomes[0]}.`,r,'comparison');
  }
 }
 for(const x of d.changeRelationships){
  const r=d.relationships.find(r=>r.dotpoint===x.dotpoint);
  add(`Analyse changes and continuities in ${x.subject} between ${x.start} and ${x.end}.`,r,'change');
 }
 for(const x of d.effectivenessRelationships){
  const r=d.relationships.find(r=>r.dotpoint===x.dotpoint);
  add(`Evaluate the effectiveness of ${x.policy} in ${x.aim}.`,r,'effectiveness');
 }
 return output;
}
const graph=graphQuestions();
function weighted(weights){const total=weights.reduce((s,x)=>s+Math.max(0,x),0);if(!total)return pick(sections).id;let v=Math.random()*total;for(let i=0;i<sections.length;i++){v-=Math.max(0,weights[i]);if(v<0)return sections[i].id}return 'D'}
function candidate(sec,mode,fam){let arr=[...bank,...templates,...graph].filter(q=>q.section===sec && (!fam||fam==='any'||(q.family&&q.family!=='curated'?q.family:family(q.question))===fam));if(mode==='curated')arr=arr.filter(q=>q.source!=='generated');if(mode==='templates')arr=arr.filter(q=>q.source==='generated');return arr}
function generate(opts={}){
 const dots=opts.dotpoints||[],features=opts.features||[];
 const allowed=opts.sections||sections.map(s=>s.id);
 const candidates=sections.filter(s=>allowed.includes(s.id)).map(s=>{
   let pool=candidate(s.id,opts.mode||'both',opts.family||'any');
   if(dots.length)pool=pool.filter(q=>dots.includes(q.dotpoint));
   if(features.length)pool=pool.filter(q=>features.some(f=>(q.features||[]).includes(f)));
   return {id:s.id,pool,weight:Math.max(0,(opts.weights||[10,20,45,25])[sections.findIndex(x=>x.id===s.id)]||0)};
 }).filter(x=>x.pool.length);
 if(!candidates.length)return null;
 let available=candidates.filter(x=>x.weight>0);
 if(!available.length)available=candidates;
 let total=available.reduce((a,x)=>a+x.weight,0);
 let chosen;
 if(total>0){let r=Math.random()*total;chosen=available[available.length-1];for(const x of available){r-=x.weight;if(r<0){chosen=x;break}}}
 else chosen=pick(available);
 let pool=chosen.pool;
 if((opts.mode||'both')==='both'&&Math.random()<0.85){
  const generated=pool.filter(q=>q.source==='generated');
  if(generated.length){const relational=generated.filter(q=>q.relationship);pool=relational.length?relational:generated;}
 }
 const recent=opts.recent||[];
 const different=pool.filter(q=>!recent.includes(normalize(q.question)));
 const q=pick(different.length?different:pool);
 return {...q,section:chosen.id,family:q.family&&q.family!=='curated'?q.family:family(q.question)};
}
function plan(q){const t=q.question.toLowerCase();const rows={
A:[['Nationalism and political mobilisation','Viet Minh leadership, anti-colonial organisation and popular support'],['Military developments','Dien Bien Phu, logistical capabilities and French strategic limitations'],['International context','Cold War pressures and diplomatic negotiation at Geneva'],['Outcomes and limits','1954 agreements, provisional division and unresolved political questions']],
B:[['South Vietnamese politics','Diem government, 1963 coup and subsequent instability'],['Society and rural opposition','Land grievances, religious tensions and insurgent recruitment'],['Cold War and US objectives','Containment, domino theory and political credibility'],['Military assistance and limitations','Advisers, counterinsurgency and Strategic Hamlet Program']],
C:[['Strategic objectives','US containment and communist unification objectives'],['Military developments','Attrition, guerrilla warfare, NVA offensives and logistical support'],['Political and civilian consequences','Tet, casualties, anti-war mobilisation and government credibility'],['Outcome and relative weight','Vietnamisation, Paris Peace Accords and communist victory in 1975']],
D:[['Domestic political context','Cambodian instability or Laotian political divisions'],['Foreign intervention','North Vietnamese involvement, US bombing and regional conflict'],['Communist organisation','Khmer Rouge or Pathet Lao leadership and military support'],['Consequences and judgement','Civilian experiences, 1975 victories and post-war policies']]
};let a=rows[q.section]||rows.C;let claims=[
{title:'Argument 1 · Emphasise the central factor',thesis:'The factor named in the question was highly significant, but its importance depended on the wider political and military context.',points:a},
{title:'Argument 2 · Weigh competing factors',thesis:'The strongest judgement emerges from comparing the nominated factor with alternative explanations and their interaction.',points:[a[1],a[0],a[2],a[3]]},
{title:'Argument 3 · Evaluate change and limits',thesis:'The significance of the development changed over time, and its impact should be judged against stated objectives and longer-term outcomes.',points:[a[2],a[0],a[3],a[1]]}
];return claims}
window.Indochina={data:d,generate,plan,family,normalize,graph};})();