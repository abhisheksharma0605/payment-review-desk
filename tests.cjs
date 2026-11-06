const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('./core.js');const sample=P.parseCSV(P.sample);
let results=[];function test(name,fn){fn();results.push({test:name,result:'PASS'});}
test('Payment sample contains 12 records and 6 flagged rows',()=>assert.equal(P.analyze(sample).filter(x=>x.issues.length).length,6));
test('Repeated-reference and similarity groups contain four paid records',()=>assert.equal(P.analyze(sample).filter(x=>x.related.length).length,4));
test('Same amount and payee in different currencies is not matched',()=>{const a=sample[0],b={...a,id:'other',currency:'CAD'};assert.equal(P.analyze([a,b]).filter(x=>x.related.length).length,0);});
test('Two-day boundary is included, three-day gap excluded',()=>{const a=sample[1],b={...a,id:'other',reference:'NEW',date:'2026-10-03'};assert.equal(P.analyze([a,b])[0].related.length,1);b.date='2026-10-04';assert.equal(P.analyze([a,b])[0].related.length,0);});
test('Failed rows are not treated as successful duplicate payments',()=>{const a=sample[0],b={...a,id:'other',status:'failed'};assert.equal(P.analyze([a,b])[0].related.length,0);});
test('Quoted commas and embedded newlines parse correctly',()=>{const csv='id,date,payee,reference,amount,currency,status\nX,2026-10-01,"Company, Inc.","REF\n001",10.25,USD,paid';const rows=P.parseCSV(csv);assert.equal(rows[0].payee,'Company, Inc.');assert.equal(rows[0].reference,'REF\n001');assert.equal(rows[0].cents,1025);});
test('Invalid calendar date is rejected',()=>assert.throws(()=>P.parseCSV(P.sample.replace('2026-10-01','2026-02-30'))));
test('Duplicate record ID is rejected',()=>assert.throws(()=>P.parseCSV(P.sample.replace('PAY-102','PAY-101'))));
test('Fractional-cent and negative amounts are rejected',()=>{assert.throws(()=>P.parseCSV(P.sample.replace('1280.00','12.345')));assert.throws(()=>P.parseCSV(P.sample.replace('1280.00','-12.00')));});
test('Malformed quotes and duplicate columns are rejected',()=>{assert.throws(()=>P.parseCSV(P.sample.replace('Northline Supplies','"Northline')));assert.throws(()=>P.parseCSV(P.sample.replace('currency,status','status,status')));});
test('Review exports retain notes and neutralize spreadsheet formulas',()=>{const csv=P.exportCSV(P.analyze(sample),{'PAY-101':{decision:'investigate',note:'=1+1'}});assert.ok(csv.includes('investigate'));assert.ok(csv.includes("'=1+1"));});
const summary={executedAt:new Date().toISOString(),testsPassed:results.length,results};fs.mkdirSync(path.join(__dirname,'evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'evidence/test-results.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
