const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'dist'),E=require('./dist/assets/engine.js'),data=E.parseWorkbook(fs.readFileSync(root+'/files/ATM_Dispute_Data_Analysis.xlsx')),original=E.clone(data.sheets),sheets=E.clone(original),hf=E.build(sheets);
const get=(name,row,col)=>hf.getCellValue({sheet:hf.getSheetId(name),row:row-1,col:col-1});
const baseline=[120,21.291666666666668,112,112/120,1,.8,4,4/120,97,97/120,4.360824742268041,6,3,23,12];baseline.forEach((v,i)=>assert(Math.abs(get('Summary',i+6,2)-v)<1e-7,'summary '+i));
E.validate(sheets);for(let r=25;r<=36;r++)assert(typeof get('Summary',r,8)==='number');
const initSqlJs=require('./dist/assets/sql-wasm.js');let last;const context={console,Date,Set,Error,Math,Number,initSqlJs:opts=>initSqlJs({locateFile:()=>root+'/assets/sql-wasm.wasm'}),importScripts(){},self:{postMessage:m=>last=m}};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/assets/sql-worker.js','utf8'),context);
const send=async(type,extra={})=>{await context.self.onmessage({data:{type,id:1,...extra}});assert.notEqual(last.type,'error',last.message);return last;};
const view=fs.readFileSync(root+'/assets/view.sql','utf8'),queries=JSON.parse(fs.readFileSync(root+'/assets/queries.json'));
(async()=>{
 await send('sync',{snapshot:E.snapshot(sheets),view});
 for(const q of queries){const out=await send('run',{sql:q.sql});console.log(q.id,out.results.map(x=>x.total).join(',')+' rows');}
 async function compare(){const out=await send('run',{sql:'SELECT case_id,response_work_minutes,response_target_met,verification_workdays,customer_wait_hours,accounting_wait_work_minutes,same_day_refund,sla_deadline,within_sla,low_rating FROM service_metrics ORDER BY case_id;'});assert.equal(out.results[0].total,120);for(let i=0;i<120;i++){const a=out.results[0].values[i];for(let j=1;j<=9;j++){const v=get('Cases',i+6,j+12);if(j===7)assert.equal(a[j],E.iso(v));else if(j===9&&(v===''||v===null))assert.equal(a[j],0);else assert(Math.abs(a[j]-v)<.006,`Case ${i} metric ${j}: SQL ${a[j]} Excel ${v}`);}}}
 await compare();
 function edit(name,r,c,val){sheets[name][r-1][c-1]=val;E.validate(sheets);hf.setCellContents({sheet:hf.getSheetId(name),row:r-1,col:c-1},[[val]]);}
 edit('Guide',6,2,29);assert(get('Summary',8,2)<112);await send('sync',{snapshot:E.snapshot(sheets),view});await compare();edit('Guide',6,2,30);
 const row=sheets.Cases.findIndex((x,i)=>i>=5&&i<125&&x[8]===null)+1;edit('Cases',row,9,1);assert.equal(get('Summary',14,2),98);assert.equal(get('Summary',17,2),7);await send('sync',{snapshot:E.snapshot(sheets),view});await compare();edit('Cases',row,9,null);
 edit('Guide',11,2,4);await send('sync',{snapshot:E.snapshot(sheets),view});await compare();edit('Guide',11,2,2);
 const old=get('Cases',6,6);let overdue=Math.floor(get('Cases',6,19))+1+16/24;while([0,6].includes(new Date(Date.UTC(1899,11,30)+overdue*86400000).getUTCDay()))overdue++;edit('Cases',6,6,overdue);assert.equal(get('Cases',6,20),0);await send('sync',{snapshot:E.snapshot(sheets),view});await compare();edit('Cases',6,6,old);
 const exportBytes=E.exportBook(sheets,hf),roundtrip=E.parseWorkbook(exportBytes),roundHf=E.build(roundtrip.sheets);assert.equal(roundHf.getCellValue({sheet:roundHf.getSheetId('Summary'),row:5,col:1}),120);
 const bad=E.clone(sheets);bad.Cases[5][8]=6;assert.throws(()=>E.validate(bad));const bad2=E.clone(sheets);bad2.Cases[5][3]=bad2.Cases[5][2]-1;assert.throws(()=>E.validate(bad2));
 const browser={console,TextEncoder,TextDecoder,Intl,Date,Math,Set,Map,Array,JSON,Number,String,Boolean,RegExp,Error,TypeError,parseInt,parseFloat,isNaN,Symbol,Promise,setTimeout,clearTimeout};browser.window=browser;browser.self=browser;vm.createContext(browser);vm.runInContext(fs.readFileSync(root+'/assets/xlsx.full.min.js','utf8'),browser);vm.runInContext(fs.readFileSync(root+'/assets/hyperformula.full.min.js','utf8'),browser);vm.runInContext(fs.readFileSync(root+'/assets/engine.js','utf8'),browser);assert(browser.PortfolioEngine);assert.equal(typeof browser.HyperFormula.buildFromSheets,'function');
 console.log('PASS: baseline metrics, all 8 SQL queries, every row Excel/SQL, target/feedback/low-rating/SLA edits, validation, Excel export round-trip, browser global setup.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
