
'use strict';
const $=id=>document.getElementById(id),C=PaymentCore;
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let raw=[],rows=[],decisions={},selected='',label='No file loaded';
function msg(s,error=false){$('message').textContent=s;$('message').className='notice'+(error?' error':'');}
function save(){try{localStorage.setItem('payment-review-v1',JSON.stringify({raw,decisions,label}));}catch{msg('Review works, but this browser could not save it. Export your results before closing.',true);}}
function money(p){return p.currency+' '+(p.cents/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
function reviewed(p){return decisions[p.id]&&decisions[p.id].decision!=='unreviewed';}
function render(){
 const flagged=rows.filter(p=>p.issues.length),done=flagged.filter(reviewed).length;
 const cards=[['Payments loaded',rows.length,'One row per payment record'],['Rows flagged',flagged.length,'Possible duplicates or status issues'],['Flagged rows reviewed',done+' / '+flagged.length,'A recorded decision, not resolution'],['Review progress',flagged.length?Math.round(done/flagged.length*100)+'%':'—','Flagged rows with a saved decision']];
 $('metrics').innerHTML=cards.map((x,i)=>'<div class="metric '+(i===3?'emphasis':'')+'"><span class="label">'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div>').join('');
 const term=$('search').value.toLowerCase(),filter=$('filter').value;
 const shown=rows.filter(p=>(p.id+' '+p.payee+' '+p.reference).toLowerCase().includes(term)&&({all:true,flagged:p.issues.length>0,unreviewed:p.issues.length>0&&!reviewed(p),reviewed:reviewed(p),clear:!p.issues.length}[filter]));
 $('rows').innerHTML=shown.map(p=>'<tr><td><strong>'+e(p.payee)+'</strong><small>'+e(p.id)+' · '+e(p.date)+'</small></td><td><strong>'+e(money(p))+'</strong><small>'+e(p.reference)+'</small></td><td><span class="pill '+(p.issues.length?'warn':'good')+'">'+(p.related.length?'Possible duplicate':p.issues.length?e(p.status):'No flags')+'</span></td><td><span class="pill">'+e(({investigate:'Investigating',valid:'Valid',duplicate:'Duplicate',unreviewed:'Not reviewed'})[(decisions[p.id]||{}).decision||'unreviewed'])+'</span></td><td><button class="open" data-id="'+e(p.id)+'" aria-label="Review '+e(p.id)+'">Review ↗</button></td></tr>').join('');
 $('empty').hidden=shown.length>0;if(rows.length&&!shown.length)$('empty').textContent='No payments match this view.';
 $('export').disabled=!rows.length;$('datasetLabel').textContent=label;
 const series=[['Possible duplicate',rows.filter(p=>p.related.length).length],['Pending status',rows.filter(p=>p.status==='pending').length],['Failed status',rows.filter(p=>p.status==='failed').length],['No flags',rows.filter(p=>!p.issues.length).length]];
 $('chart').innerHTML=series.map(([name,n])=>'<div class="bar-row"><div class="bar-label"><span>'+name+'</span><strong>'+n+'</strong></div><div class="bar-track"><div class="bar-fill" style="width:'+(rows.length?n/rows.length*100:0)+'%"></div></div></div>').join('')+'<p class="tiny muted">Counts of records, not financial loss. Similarity checks apply only to paid records.</p>';
 document.querySelectorAll('.open').forEach(b=>b.onclick=()=>openReview(b.dataset.id));
}
function openReview(id){selected=id;const p=rows.find(p=>p.id===id),d=decisions[id]||{};$('detailBody').innerHTML='<h3>'+e(p.payee)+' · '+e(money(p))+'</h3><p>'+e(p.id)+' · '+e(p.reference)+'</p>'+p.issues.map(s=>'<div class="issue">'+e(s)+'</div>').join('')+(p.related.length?'<p class="tiny"><strong>Compare with:</strong> '+e(p.related.join(', '))+'</p>':'')+(!p.issues.length?'<p>No automated flags. You can still record a manual review.</p>':'');$('decision').value=d.decision||'unreviewed';$('note').value=d.note||'';$('detail').showModal();}
function load(text,name){const parsed=C.parseCSV(text);raw=parsed;rows=C.analyze(parsed);decisions={};label=name;save();render();msg(name+' loaded. '+rows.filter(p=>p.issues.length).length+' of '+rows.length+' records need attention.');}
function download(name,text,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('sample').onclick=()=>{if(raw.length&&!confirm('Replace the current dataset and review decisions with the sample? Export first if you need a copy.'))return;load(C.sample,'Sample · 12 fictional payments');};
$('upload').onchange=async()=>{const f=$('upload').files[0];if(!f)return;try{if(f.size>1000000)throw Error('Use a CSV under 1 MB.');const text=await f.text();C.parseCSV(text);if(raw.length&&!confirm('Replace the current dataset and review decisions?'))return;load(text,f.name);}catch(err){msg(err.message,true);}finally{$('upload').value='';}};
$('export').onclick=()=>download('payment-review.csv',C.exportCSV(rows,decisions),'text/csv;charset=utf-8');
$('template').onclick=()=>download('sample-payments.csv',C.sample,'text/csv;charset=utf-8');
$('search').oninput=render;$('filter').onchange=render;
$('reviewForm').onsubmit=ev=>{ev.preventDefault();if($('decision').value!=='unreviewed'&&!$('note').value.trim()){msg('Add a note explaining your review decision.',true);$('note').focus();return;}decisions[selected]={decision:$('decision').value,note:$('note').value.trim()};save();$('detail').close();render();msg('Decision saved for '+selected+'. Export the review to share it.');};
$('guide').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();$('closeDetail').onclick=()=>$('detail').close();
try{const saved=JSON.parse(localStorage.getItem('payment-review-v1')||'null');if(saved&&Array.isArray(saved.raw)){const csv=['id,date,payee,reference,amount,currency,status',...saved.raw.map(p=>[p.id,p.date,p.payee,p.reference,p.amount,p.currency,p.status].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','))].join('\n');raw=C.parseCSV(csv);rows=C.analyze(raw);decisions=saved.decisions||{};label=saved.label||'Saved dataset';}}catch{msg('Saved data could not be restored. Load the sample or import a CSV.');}
render();
