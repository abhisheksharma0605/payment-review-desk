
(function(root){
'use strict';
function parseCSV(text){
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],value='',quoted=false,ended=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++;}else if(c==='"'){quoted=false;ended=true;}else value+=c;}
  else if(c===','||c==='\n'||c==='\r'){row.push(value);value='';ended=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v.trim()))rows.push(row);row=[];}}
  else if(c==='"'){if(value||ended)throw Error('Unexpected quote in CSV.');quoted=true;}
  else {if(ended)throw Error('Unexpected text after a closing quote.');value+=c;}
 }
 if(quoted)throw Error('A quoted CSV field was not closed.');
 if(value||row.length){row.push(value);if(row.some(v=>v.trim()))rows.push(row);}
 if(rows.length<2)throw Error('Include a header and at least one payment.');
 const keys=rows.shift().map(s=>s.trim().toLowerCase()),required=['id','date','payee','reference','amount','currency','status'];
 if(keys.length!==required.length||new Set(keys).size!==keys.length||required.some(k=>!keys.includes(k)))throw Error('Use these seven headers: '+required.join(', '));
 if(rows.length>5000)throw Error('Use 5,000 rows or fewer.');
 const ids=new Set();
 return rows.map((cells,index)=>{
  if(cells.length!==keys.length)throw Error('Row '+(index+2)+': wrong number of fields.');
  const p=Object.fromEntries(keys.map((k,i)=>[k,cells[i].trim()]));p.currency=p.currency.toUpperCase();p.status=p.status.toLowerCase();
  if(!p.id||ids.has(p.id))throw Error('Row '+(index+2)+': payment ID must be unique and nonblank.');ids.add(p.id);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))||new Date(p.date).toISOString().slice(0,10)!==p.date)throw Error('Row '+(index+2)+': use a valid YYYY-MM-DD date.');
  if(!p.payee||!p.reference)throw Error('Row '+(index+2)+': payee and reference are required.');
  if(!/^\d{1,9}(\.\d{1,2})?$/.test(p.amount)||Number(p.amount)<=0)throw Error('Row '+(index+2)+': amount must be positive with at most two decimal places.');
  p.cents=Math.round(Number(p.amount)*100);p.amount=(p.cents/100).toFixed(2);
  if(!/^[A-Z]{3}$/.test(p.currency))throw Error('Row '+(index+2)+': currency must be three letters.');
  if(!['paid','pending','failed'].includes(p.status))throw Error('Row '+(index+2)+': status must be paid, pending or failed.');
  return p;
 });
}
function norm(v){return v.trim().replace(/\s+/g,' ').toUpperCase();}
function analyze(rows){
 const result=rows.map(p=>({...p,issues:[],related:[]}));
 for(let i=0;i<result.length;i++){
  const a=result[i];if(a.status==='failed')a.issues.push('Failed payment — confirm whether a retry is needed.');
  if(a.status==='pending')a.issues.push('Pending payment — confirm its final status before retrying.');
  if(a.status!=='paid')continue;
  for(let j=i+1;j<result.length;j++){const b=result[j];if(b.status!=='paid'||a.currency!==b.currency)continue;
   let reason='';
   if(norm(a.reference)===norm(b.reference))reason='Repeated reference on paid records.';
   else if(norm(a.payee)===norm(b.payee)&&a.cents===b.cents&&Math.abs(Date.parse(a.date)-Date.parse(b.date))<=172800000)reason='Same payee and amount within two calendar days.';
   if(reason){for(const [x,y] of [[a,b],[b,a]]){if(!x.issues.includes(reason))x.issues.push(reason);x.related.push(y.id);}}
  }
 }
 return result;
}
function csvCell(v){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCSV(rows,decisions){return ['id,date,payee,reference,amount,currency,status,flags,related_ids,review_decision,review_note',...rows.map(p=>[p.id,p.date,p.payee,p.reference,p.amount,p.currency,p.status,p.issues.join(' | '),p.related.join(' | '),(decisions[p.id]||{}).decision||'unreviewed',(decisions[p.id]||{}).note||''].map(csvCell).join(','))].join('\r\n');}
const sample='id,date,payee,reference,amount,currency,status\nPAY-101,2026-10-01,Northline Supplies,INV-4021,1280.00,USD,paid\nPAY-102,2026-10-01,Oak Studio,INV-5003,450.00,USD,paid\nPAY-103,2026-10-02,Northline Supplies,INV-4021,1280.00,USD,paid\nPAY-104,2026-10-02,Metro Hosting,HOST-OCT,89.00,USD,paid\nPAY-105,2026-10-03,Oak Studio,INV-5004,450.00,USD,paid\nPAY-106,2026-10-03,Cedar Logistics,SHIP-918,320.00,USD,pending\nPAY-107,2026-10-04,Bluebird Print,PRINT-219,175.50,USD,paid\nPAY-108,2026-10-04,Harbour Telecom,TEL-887,125.00,USD,failed\nPAY-109,2026-10-05,Eastside Maintenance,MAIN-029,600.00,USD,paid\nPAY-110,2026-10-05,Fieldwork Design,DES-661,850.00,USD,paid\nPAY-111,2026-10-06,West Paper,PAPER-301,95.00,USD,paid\nPAY-112,2026-10-06,City Electric,ELEC-521,210.75,USD,paid';
const api={parseCSV,analyze,exportCSV,sample};if(typeof module!=='undefined')module.exports=api;root.PaymentCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
