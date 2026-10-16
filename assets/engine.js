(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./xlsx.full.min.js'),require('./hyperformula.full.min.js').HyperFormula);else root.PortfolioEngine=factory(root.XLSX,root.HyperFormula)})(typeof globalThis!=='undefined'?globalThis:this,function(XLSX,HyperFormula){
'use strict';
const BASE=Date.UTC(1899,11,30),DAY=86400000;
const clone=x=>JSON.parse(JSON.stringify(x));
const dateSerial=s=>(Date.parse(s.replace(' ','T')+(s.endsWith('Z')?'':'Z'))-BASE)/DAY;
const iso=x=>new Date(BASE+Math.round(x*DAY/1000)*1000).toISOString().slice(0,19).replace('T',' ');
function parseWorkbook(bytes){const book=XLSX.read(bytes,{type:'array'}),sheets={},formats={};for(const name of book.SheetNames){const ws=book.Sheets[name],range=XLSX.utils.decode_range(ws['!ref']);sheets[name]=[];formats[name]={};for(let r=0;r<=Math.min(range.e.r,139);r++){sheets[name][r]=[];for(let c=0;c<=range.e.c;c++){const a=XLSX.utils.encode_cell({r,c}),v=ws[a];sheets[name][r][c]=v?(v.f?'='+v.f:v.v??null):null;if(v?.z)formats[name][a]=v.z;}}}return {sheets,formats};}
function build(sheets){return HyperFormula.buildFromSheets(clone(sheets),{licenseKey:'gpl-v3',precisionRounding:10});}
function raw(sheets,name,row,col){return sheets[name]?.[row]?.[col]??null;}
function validate(sheets){
 const g=sheets.Guide,sla=+g[4][1],target=+g[5][1],open=+g[6][1],close=+g[7][1],cutoff=+g[8][1],low=+g[10][1];
 if(!Number.isInteger(sla)||sla<1||sla>30)throw Error('Refund SLA must be a whole number from 1 to 30 workdays.');
 if(!Number.isFinite(target)||target<0||target>(close-open)*1440+.001)throw Error('Reply target must be between zero and the length of a workday.');
 if(!(open>=0&&close<=1&&open<close&&cutoff>=open&&cutoff<=close))throw Error('Check workday opening, closing and late-arrival times.');
 if(!Number.isInteger(low)||low<1||low>5)throw Error('Low-rating threshold must be a whole number from 1 to 5.');
 const holidays=new Set();for(let i=4;i<30;i++){const v=g[i]?.[4];if(v!==null&&v!==undefined&&v!==''){if(typeof v!=='number'||v<dateSerial('2025-01-01 00:00:00')||v>=dateSerial('2026-01-01 00:00:00'))throw Error('Holiday dates must be valid dates in 2025.');holidays.add(Math.floor(v));}}
 const ids=new Set();for(let r=5;r<125;r++){const x=sheets.Cases[r],id=x[0];if(!id||ids.has(id))throw Error('Case IDs must be present and unique.');ids.add(id);if(!String(x[1]??'').trim())throw Error(id+': employee ID cannot be empty.');
  for(let j=2;j<6;j++){const v=x[j];if(typeof v!=='number'||!Number.isFinite(v))throw Error(id+': enter a valid date and time.');const d=new Date(BASE+Math.round(v*DAY)),weekday=d.getUTCDay(),t=v-Math.floor(v);if(d.getUTCFullYear()!==2025||weekday===0||weekday===6||holidays.has(Math.floor(v))||t<open-1e-7||t>close+1e-7)throw Error(id+': events must fall within working hours on a 2025 workday. Check holidays and hours.');}
  if(!(x[2]<=x[3]&&x[3]<=x[4]&&x[4]<=x[5]))throw Error(id+': timestamps must follow receipt → first reply → verification → refund.');
  if(!Number.isInteger(x[6])||x[6]<=0)throw Error(id+': amount must be a positive whole number.');
  if(![0,1].includes(x[7]))throw Error(id+': rework_required must be 0 or 1.');
  if(x[8]!==null&&x[8]!==''&&(!Number.isInteger(x[8])||x[8]<1||x[8]>5))throw Error(id+': CSAT must be blank or a whole number from 1 to 5.');
  if(!['Employee','System','Process','None','Not assessed'].includes(x[10]))throw Error(id+': choose a listed responsibility category.');
 }
 return true;
}
function snapshot(sheets){validate(sheets);const g=sheets.Guide,holidays=[];for(let i=4;i<30;i++){const v=g[i]?.[4];if(typeof v==='number')holidays.push(iso(v).slice(0,10));}return {settings:[+g[4][1],+g[5][1],Math.round(g[6][1]*1440),Math.round(g[7][1]*1440),+g[10][1]],holidays,cases:sheets.Cases.slice(5,125).map(x=>x.slice(0,12).map((v,i)=>i>=2&&i<=5?iso(v):v===''?null:v))};}
function exportBook(sheets,hf){const book=XLSX.utils.book_new();for(const name of Object.keys(sheets)){const ws=XLSX.utils.aoa_to_sheet(sheets[name].map(row=>row.map(()=>null))),id=hf.getSheetId(name);for(let r=0;r<sheets[name].length;r++)for(let c=0;c<sheets[name][r].length;c++){const v=sheets[name][r][c];if(v===null)continue;const address=XLSX.utils.encode_cell({r,c});if(typeof v==='string'&&v.startsWith('=')){const result=hf.getCellValue({sheet:id,row:r,col:c});ws[address]={f:v.slice(1),v:result,t:typeof result==='number'?'n':typeof result==='boolean'?'b':'s'};}else ws[address]={v,t:typeof v==='number'?'n':'s'};
 if((name==='Cases'&&[2,3,4,5,18].includes(c)&&r>=5)||(name==='Guide'&&c===4&&r>=4&&r<30))ws[address].z=name==='Cases'?'yyyy-mm-dd hh:mm':'yyyy-mm-dd';if(name==='Guide'&&c===1&&r>=6&&r<=8)ws[address].z='hh:mm';}
 ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:sheets[name].length-1,c:Math.max(...sheets[name].map(x=>x.length))-1}});ws['!cols']=Array.from({length:22},()=>({wch:24}));XLSX.utils.book_append_sheet(book,ws,name);}return XLSX.write(book,{bookType:'xlsx',type:'array'});}
return {clone,dateSerial,iso,parseWorkbook,build,raw,validate,snapshot,exportBook};
});
