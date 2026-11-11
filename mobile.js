(()=>{'use strict';const E=window.Indochina,$=id=>document.getElementById(id),sections=E.data.sections;
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const prefKey='indochina-pwa-pref-v1',savedKey='indochina-pwa-saved-v1';let prefs=load(prefKey,{sections:['A','B','C','D'],family:'any',weights:[10,20,45,25],dotpoints:[],features:[]}),saved=load(savedKey,[]),current=null,recent=[];
prefs.dotpoints ||= [];prefs.features ||= [];const persist=()=>localStorage.setItem(prefKey,JSON.stringify(prefs));const notice=s=>$('notice').textContent=s;
function generate(random){
 const opts={weights:prefs.weights,recent,mode:'both',family:random?'any':prefs.family};
 if(!random){opts.sections=prefs.sections;opts.dotpoints=prefs.dotpoints;opts.features=prefs.features}
 const q=E.generate(opts);
 if(!q)return notice('No questions match these selections. Try clearing a dot point, key feature or question type.');
 current=q;recent.push(E.normalize(q.question));recent=recent.slice(-30);
 $('questionDisplay').textContent=q.question;
 const sec=sections.find(s=>s.id===q.section);
 const dot=E.data.dotpoints.find(d=>d.id===q.dotpoint);
 $('areaLabel').textContent=sec.name.toUpperCase()+(dot?' · '+dot.id:'');
 $('bookmarkButton').textContent=saved.some(s=>s.question===q.question)?'★':'☆';
 notice(q.source==='generated'?'Generated practice question · Historical relationship model':'Reviewed practice question · Not an official HSC question');
}
function drawPrefs(){let root=$('syllabusChoices');root.replaceChildren();sections.forEach(s=>{let label=document.createElement('label');label.className='choice';let cb=document.createElement('input');cb.type='checkbox';cb.checked=prefs.sections.includes(s.id);cb.onchange=()=>{prefs.sections=cb.checked?[...prefs.sections,s.id]:prefs.sections.filter(x=>x!==s.id);persist()};label.append(cb,document.createTextNode(s.id+' · '+s.name+' ('+s.type+')'));root.append(label)});function addChoices(rootId,items,key,fmt){
 const root=$(rootId);root.replaceChildren();
 items.forEach(item=>{
  let label=document.createElement('label');label.className='choice';
  let cb=document.createElement('input');cb.type='checkbox';cb.checked=prefs[key].includes(item.id);
  cb.onchange=()=>{prefs[key]=cb.checked?[...prefs[key],item.id]:prefs[key].filter(x=>x!==item.id);persist()};
  label.append(cb,document.createTextNode(fmt(item)));root.append(label);
 });
}
addChoices('dotpointChoices',E.data.dotpoints,'dotpoints',d=>d.id+' · '+d.name);
addChoices('keyFeatureChoices',E.data.keyFeatures,'features',f=>f.id+' · '+f.name);
$('clearSpecific').onclick=()=>{prefs.dotpoints=[];prefs.features=[];persist();drawPrefs()};
$('familyChoice').value=prefs.family;$('familyChoice').onchange=e=>{prefs.family=e.target.value;persist()};let w=$('weightControls');w.replaceChildren();sections.forEach((s,i)=>{let label=document.createElement('label');label.textContent=s.id+': ';let input=document.createElement('input');input.type='number';input.min=0;input.max=100;input.value=prefs.weights[i];input.setAttribute('aria-label',s.name+' weight');input.onchange=()=>{prefs.weights[i]=Math.max(0,Number(input.value)||0);persist()};label.append(input);w.append(label)})}
function drawSaved(){let root=$('savedList');root.replaceChildren();if(!saved.length){root.textContent='No saved questions yet.';return}saved.forEach(q=>{let box=document.createElement('div');box.className='saveditem';let t=document.createElement('p');t.textContent=q.question;let show=document.createElement('button');show.className='smallbutton';show.textContent='Show';show.onclick=()=>{current=q;$('questionDisplay').textContent=q.question;$('areaLabel').textContent=sections.find(s=>s.id===q.section).name.toUpperCase();$('bookmarkButton').textContent='★';close()};let del=document.createElement('button');del.className='smallbutton';del.textContent='Remove';del.onclick=()=>{saved=saved.filter(x=>x.question!==q.question);localStorage.setItem(savedKey,JSON.stringify(saved));drawSaved()};box.append(t,show,del);root.append(box)})}
function open(){ $('drawer').hidden=false;$('scrim').hidden=false}function close(){$('drawer').hidden=true;$('scrim').hidden=true}
$('menuButton').onclick=open;$('closeMenu').onclick=close;$('scrim').onclick=close;document.querySelectorAll('.navitem').forEach(b=>b.onclick=()=>{document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='view-'+b.dataset.view);if(b.dataset.view==='saved')drawSaved();open()});
$('randomButton').onclick=()=>generate(true);$('preferencesButton').onclick=()=>generate(false);$('resetWeights').onclick=()=>{prefs.weights=[10,20,45,25];persist();drawPrefs()};$('bookmarkButton').onclick=()=>{if(!current)return;let exists=saved.some(x=>x.question===current.question);saved=exists?saved.filter(x=>x.question!==current.question):[current,...saved];localStorage.setItem(savedKey,JSON.stringify(saved));$('bookmarkButton').textContent=exists?'☆':'★'};
let promptEvent=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;$('installButton').hidden=false;$('installStatus').textContent='Ready to install'});$('installButton').onclick=async()=>{if(promptEvent){await promptEvent.prompt();promptEvent=null;$('installButton').hidden=true}};
let peaks=[],lastShake=0,listening=false;const shake=$('shakeToggle'),status=$('motionStatus'),perm=$('motionPermissionButton');function onMotion(e){let a=e.accelerationIncludingGravity;if(!a)return;let strength=Math.sqrt((a.x||0)**2+(a.y||0)**2+(a.z||0)**2);let now=Date.now();if(strength>22){peaks.push(now);peaks=peaks.filter(x=>now-x<900);if(peaks.length>=2&&now-lastShake>1700){lastShake=now;peaks=[];generate(true)}}}function enable(){if(!listening){window.addEventListener('devicemotion',onMotion,{passive:true});listening=true}status.textContent='Shake detection enabled'}function disable(){window.removeEventListener('devicemotion',onMotion);listening=false;status.textContent='Shake detection disabled'}shake.onchange=async()=>{if(!shake.checked)return disable();if(typeof DeviceMotionEvent==='undefined'){status.textContent='Motion sensors not supported';shake.checked=false;return}if(typeof DeviceMotionEvent.requestPermission==='function'){perm.hidden=false;status.textContent='Tap Allow motion access';return}enable()};perm.onclick=async()=>{try{let result=await DeviceMotionEvent.requestPermission();if(result==='granted'){perm.hidden=true;enable()}else{shake.checked=false;status.textContent='Motion access denied'}}catch{shake.checked=false;status.textContent='Motion permission unavailable'}};
drawPrefs();generate(true);if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));})();