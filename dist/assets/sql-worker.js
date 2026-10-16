importScripts('sql-wasm.js');
const ready=initSqlJs({locateFile:file=>file});let db;
self.onmessage=async({data:m})=>{try{const SQL=await ready;if(m.type==='sync'){
 const next=new SQL.Database();next.run('CREATE TABLE settings(sla_days INTEGER,response_target_min REAL,open_min INTEGER,close_min INTEGER,low_rating_threshold INTEGER); CREATE TABLE work_calendar(calendar_date TEXT PRIMARY KEY,is_workday INTEGER,workday_index INTEGER); CREATE TABLE cases(case_id TEXT PRIMARY KEY,employee_id TEXT,received_at TEXT,first_response_at TEXT,verified_at TEXT,refunded_at TEXT,amount_vnd INTEGER,rework_required INTEGER,csat_score INTEGER,feedback_theme TEXT,feedback_responsibility TEXT,feedback_note TEXT);');
 next.run('INSERT INTO settings VALUES (?,?,?,?,?)',m.snapshot.settings);
 const holidays=new Set(m.snapshot.holidays),calendar=next.prepare('INSERT INTO work_calendar VALUES (?,?,?)');let index=0;
 for(let stamp=Date.UTC(2024,0,1);stamp<=Date.UTC(2027,0,31);stamp+=86400000){const d=new Date(stamp),date=d.toISOString().slice(0,10),work=+(![0,6].includes(d.getUTCDay())&&!holidays.has(date));index+=work;calendar.run([date,work,index]);}calendar.free();
 const insert=next.prepare('INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');for(const row of m.snapshot.cases)insert.run(row);insert.free();next.run(m.view);if(db)db.close();db=next;self.postMessage({id:m.id,type:'synced'});
 }else if(m.type==='run'){
 if(!db)throw Error('The workbook is still loading.');const results=[],statements=db.iterateStatements(m.sql);let statementCount=0;
 for(const statement of statements){statementCount++;const columns=statement.getColumnNames(),rows=[];let total=0;while(statement.step()){total++;if(rows.length<1000)rows.push(statement.get());}if(columns.length)results.push({columns,values:rows,total});}
 self.postMessage({id:m.id,type:'result',results,statementCount});
 }}catch(e){self.postMessage({id:m.id,type:'error',message:e.message});}};
