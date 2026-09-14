const STATUSES = new Set(["TO DO","EXECUTING","PASSED","FAILED","BLOCKED","ABORTED"]);
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store"}});
const uid = () => crypto.randomUUID();
const iso = () => new Date().toISOString();
const body = async req => { try { return await req.json(); } catch { throw new Error("Ungültige JSON-Daten"); } };
const cleanStatus = value => { const v=String(value||"TO DO").toUpperCase(); if(!STATUSES.has(v)) throw new Error("Ungültiger Status"); return v; };

async function audit(db, releaseId, test, field, oldValue, newValue, note="", actor="") {
  await db.prepare("INSERT INTO audit_log (id,release_id,test_case_id,test_key,field,old_value,new_value,note,actor,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(uid(),releaseId,test?.id||null,test?.test_key||"",field,String(oldValue??""),String(newValue??""),note,actor,iso()).run();
}
async function getRelease(db,id){
  const release=await db.prepare("SELECT * FROM releases WHERE id=?").bind(id).first(); if(!release)return null;
  const cases=(await db.prepare("SELECT * FROM test_cases WHERE release_id=? ORDER BY test_key").bind(id).all()).results;
  const ids=cases.map(x=>x.id); let steps=[];
  if(ids.length){const marks=ids.map(()=>"?").join(",");steps=(await db.prepare(`SELECT * FROM test_steps WHERE test_case_id IN (${marks}) ORDER BY test_case_id,step_no`).bind(...ids).all()).results;}
  const byCase=new Map();steps.forEach(s=>{if(!byCase.has(s.test_case_id))byCase.set(s.test_case_id,[]);byCase.get(s.test_case_id).push(s)});
  cases.forEach(t=>t.steps=byCase.get(t.id)||[]); return {...release,tests:cases};
}
async function importTests(db,releaseId,payload){
  const release=await db.prepare("SELECT * FROM releases WHERE id=?").bind(releaseId).first();if(!release)return json({error:"Release nicht gefunden"},404);
  const tests=Array.isArray(payload.tests)?payload.tests:[];if(!tests.length)return json({error:"Keine Testfälle übermittelt"},400);
  const at=iso();const statements=[];
  statements.push(db.prepare("DELETE FROM audit_log WHERE release_id=?").bind(releaseId));
  statements.push(db.prepare("DELETE FROM test_steps WHERE test_case_id IN (SELECT id FROM test_cases WHERE release_id=?)").bind(releaseId));
  statements.push(db.prepare("DELETE FROM test_cases WHERE release_id=?").bind(releaseId));
  statements.push(db.prepare("UPDATE releases SET source_name=?,updated_at=? WHERE id=?").bind(payload.sourceName||"Xray CSV",at,releaseId));
  for(const raw of tests){const id=uid(),status=cleanStatus(raw.status||raw.local_status);statements.push(db.prepare("INSERT INTO test_cases (id,release_id,test_key,summary,test_type,workflow_status,original_status,local_status,sync_status,tester,comment,actual_result,defect,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,releaseId,String(raw.key||raw.test_key||"").trim(),String(raw.summary||"").trim(),raw.testType||raw.test_type||"Manual",raw.workflowStatus||raw.workflow_status||"",status,status,"UNCHANGED",raw.tester||"",raw.comment||"",raw.actualResult||raw.actual_result||"",raw.defect||"",at));for(const [i,s] of (raw.steps||[]).entries())statements.push(db.prepare("INSERT INTO test_steps (id,test_case_id,step_no,action,test_data,expected_result,actual_result) VALUES (?,?,?,?,?,?,?)").bind(uid(),id,Number(s.number||s.step_no||i+1),s.action||"",s.data||s.test_data||"",s.expectedResult||s.expected_result||"",s.actualResult||s.actual_result||""));}
  await db.batch(statements);await audit(db,releaseId,null,"CSV-Import","",`${tests.length} Testfälle`,payload.sourceName||"");return json(await getRelease(db,releaseId));
}
async function api(req,env){
  const url=new URL(req.url),parts=url.pathname.split("/").filter(Boolean),method=req.method;
  try{
    if(url.pathname==="/api/health")return json({ok:true,service:"Mini Xray ReleaseDesk",time:iso()});
    if(url.pathname==="/api/releases"&&method==="GET")return json((await env.DB.prepare("SELECT *, (SELECT COUNT(*) FROM test_cases t WHERE t.release_id=releases.id) test_count FROM releases ORDER BY updated_at DESC").all()).results);
    if(url.pathname==="/api/releases"&&method==="POST"){const p=await body(req),id=uid(),at=iso();await env.DB.prepare("INSERT INTO releases (id,name,execution_key,source_name,environment,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(id,String(p.name||"Release Test"),p.executionKey||"",p.sourceName||"",p.environment||"",at,at).run();return json(await getRelease(env.DB,id),201);}
    if(parts[1]==="releases"&&parts[2]){const id=parts[2];
      if(parts.length===3&&method==="GET"){const r=await getRelease(env.DB,id);return r?json(r):json({error:"Release nicht gefunden"},404);}
      if(parts[3]==="import"&&method==="POST")return importTests(env.DB,id,await body(req));
      if(parts[3]==="audit"&&method==="GET")return json((await env.DB.prepare("SELECT * FROM audit_log WHERE release_id=? ORDER BY created_at DESC LIMIT 1000").bind(id).all()).results);
      if(parts[3]==="tests"&&method==="DELETE"){await env.DB.batch([env.DB.prepare("DELETE FROM audit_log WHERE release_id=?").bind(id),env.DB.prepare("DELETE FROM test_steps WHERE test_case_id IN (SELECT id FROM test_cases WHERE release_id=?)").bind(id),env.DB.prepare("DELETE FROM test_cases WHERE release_id=?").bind(id)]);return json({ok:true});}
      if(parts[3]==="bulk-status"&&method==="PATCH"){const p=await body(req),status=cleanStatus(p.status),ids=Array.isArray(p.ids)?p.ids:[];for(const tid of ids){const t=await env.DB.prepare("SELECT * FROM test_cases WHERE id=? AND release_id=?").bind(tid,id).first();if(t&&t.local_status!==status){await env.DB.prepare("UPDATE test_cases SET local_status=?,sync_status='CHANGED',updated_at=? WHERE id=?").bind(status,iso(),tid).run();await audit(env.DB,id,t,"Status",t.local_status,status,"Sammeländerung",p.actor||"");}}return json(await getRelease(env.DB,id));}
      if(parts[3]==="reconcile"&&method==="POST"){const p=await body(req),remote=new Map((p.tests||[]).map(t=>[String(t.key||t.test_key),cleanStatus(t.status||t.local_status)]));const current=await getRelease(env.DB,id);let conflicts=0;for(const t of current.tests){if(!remote.has(t.test_key))continue;const rs=remote.get(t.test_key),localChanged=t.local_status!==t.original_status,remoteChanged=rs!==t.original_status;let local=t.local_status,original=t.original_status,sync=t.sync_status,remoteStatus=rs;if(localChanged&&remoteChanged&&local!==rs){sync="CONFLICT";conflicts++;}else if(!localChanged&&remoteChanged){local=original=rs;sync="UNCHANGED";}else if(localChanged&&local===rs){original=rs;sync="SYNCED";remoteStatus=null;}await env.DB.prepare("UPDATE test_cases SET local_status=?,original_status=?,remote_status=?,sync_status=?,updated_at=? WHERE id=?").bind(local,original,remoteStatus,sync,iso(),t.id).run();}return json({conflicts,release:await getRelease(env.DB,id)});}
    }
    if(parts[1]==="tests"&&parts[2]){const id=parts[2],t=await env.DB.prepare("SELECT * FROM test_cases WHERE id=?").bind(id).first();if(!t)return json({error:"Testfall nicht gefunden"},404);
      if(method==="PATCH"){const p=await body(req),allowed={status:"local_status",tester:"tester",comment:"comment",actualResult:"actual_result",defect:"defect",summary:"summary",workflowStatus:"workflow_status"};for(const [input,col] of Object.entries(allowed)){if(p[input]===undefined)continue;const value=input==="status"?cleanStatus(p[input]):String(p[input]??"");if(String(t[col]??"")===value)continue;await env.DB.prepare(`UPDATE test_cases SET ${col}=?,sync_status='CHANGED',updated_at=? WHERE id=?`).bind(value,iso(),id).run();await audit(env.DB,t.release_id,t,input,t[col],value,"",p.actor||"");t[col]=value;}return json(await getRelease(env.DB,t.release_id));}
      if(method==="DELETE"){await audit(env.DB,t.release_id,t,"Testfall","Vorhanden","Gelöscht");await env.DB.prepare("DELETE FROM test_cases WHERE id=?").bind(id).run();return json({ok:true});}
      if(parts[3]==="steps"&&method==="POST"){const p=await body(req),stepId=uid(),n=Number(p.stepNo||1);await env.DB.prepare("INSERT INTO test_steps (id,test_case_id,step_no,action,test_data,expected_result,actual_result) VALUES (?,?,?,?,?,?,?)").bind(stepId,id,n,p.action||"",p.data||"",p.expectedResult||"",p.actualResult||"").run();await audit(env.DB,t.release_id,t,`Schritt ${n}`,"","Erstellt");return json(await getRelease(env.DB,t.release_id),201);}
    }
    if(parts[1]==="steps"&&parts[2]){const id=parts[2],s=await env.DB.prepare("SELECT s.*,t.release_id,t.test_key FROM test_steps s JOIN test_cases t ON t.id=s.test_case_id WHERE s.id=?").bind(id).first();if(!s)return json({error:"Schritt nicht gefunden"},404);if(method==="PATCH"){const p=await body(req),allowed={action:"action",data:"test_data",expectedResult:"expected_result",actualResult:"actual_result"};for(const [input,col] of Object.entries(allowed))if(p[input]!==undefined)await env.DB.prepare(`UPDATE test_steps SET ${col}=? WHERE id=?`).bind(String(p[input]??""),id).run();await audit(env.DB,s.release_id,{id:s.test_case_id,test_key:s.test_key},`Schritt ${s.step_no}`,"","Bearbeitet");return json({ok:true});}if(method==="DELETE"){await env.DB.prepare("DELETE FROM test_steps WHERE id=?").bind(id).run();await audit(env.DB,s.release_id,{id:s.test_case_id,test_key:s.test_key},`Schritt ${s.step_no}`,"Vorhanden","Gelöscht");return json({ok:true});}}
    return json({error:"Route nicht gefunden"},404);
  }catch(error){return json({error:error.message||"Serverfehler"},400);}
}
export default {async fetch(req,env){const url=new URL(req.url);if(url.pathname.startsWith("/api/"))return api(req,env);return env.ASSETS.fetch(req);}};
