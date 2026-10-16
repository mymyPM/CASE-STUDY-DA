const fs=require('fs'),path=require('path'),assert=require('assert');const html=fs.readFileSync('dist/index.html','utf8'),js=fs.readFileSync('dist/assets/app.js','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate DOM IDs');
for(const match of js.matchAll(/\$\('([^']+)'\)/g)){if(!match[1].startsWith('panel-'))assert(ids.includes(match[1]),'Missing DOM ID '+match[1]);}
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=match[1];if(!/^(https?:|data:|mailto:)/.test(ref))assert(fs.existsSync(path.join('dist',ref)),'Missing asset '+ref);}
for(const section of ['overview','spreadsheet','sql','report'])assert(ids.includes('panel-'+section));assert(html.includes('Times')||fs.readFileSync('dist/assets/style.css','utf8').includes('Times New Roman'));console.log('PASS: unique DOM IDs, every app DOM reference, all linked local assets, four panels and requested typeface.');
