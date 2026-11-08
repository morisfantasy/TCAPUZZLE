import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {compile,fingerprint,preview,lineCatalogue,plan,dashboard,initial,grade,moveResult,nextInLine,prompt,problem} from './opening-core.mjs';

export const coach=u=>!!u&&['admin','superadmin'].includes(u.role);
export const slugOK=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{1,69}$/.test(s)&&!['admin','purchases','session','webhook','new'].includes(s);
const one=async(db,sql,args=[])=>(await db.query(sql,args)).rows[0];
export async function transaction(pool,fn) {
  const db=await pool.connect();
  try{await db.query('BEGIN');const out=await fn(db);await db.query('COMMIT');return out;}
  catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
}
export const lock=(db,key)=>db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
function coverValue(value){
  if(['sicilian','mint','amber'].includes(value))return value;
  const m=typeof value==='string'&&value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!m||value.length>350000)throw problem(400,'Choose a cover or upload a PNG, JPEG or WebP under 250 KB.');
  const b=Buffer.from(m[2],'base64');
  const ok=m[1]==='png'?b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):m[1]==='jpeg'?b[0]===255&&b[1]===216:b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
  if(!ok||b.length>256000)throw problem(400,'Invalid cover image.');return value;
}
export function catalogRow(row,u){
  const owned=!!row.owned,allowed=owned||coach(u);
  return {slug:row.slug,name:row.name,description:row.description,cover:row.cover,price:row.price,published:row.published,revision:row.revision,version:row.current_version,
    stats:row.stats,side:row.preview.side,owned,allowed};
}
export function createStore(pool){
  const models=new Map();
  async function version(slug,v,db=pool){
    const k=slug+'/'+v;if(models.has(k))return models.get(k);
    const row=await one(db,'SELECT model FROM opening_versions WHERE product=$1 AND version=$2',[slug,v]);
    if(!row)throw problem(404,'Version not found.');
    models.set(k,row.model);if(models.size>5)models.delete(models.keys().next().value);
    return row.model;
  }
  const selector='SELECT p.*, (SELECT min(a.version) FROM opening_access a WHERE a.product=p.slug AND a.user_id=$1 AND a.active) AS owned FROM opening_products p';
  async function product(slug,u,db=pool){
    const p=await one(db,selector+' WHERE p.slug=$2',[u?.id??null,slug]);
    if(!p||(!p.published&&!p.owned&&!coach(u)))throw problem(404,'Repertoire not found.');return p;
  }
  async function access(slug,u,v,db=pool){
    if(!u)throw problem(401,'Please sign in.');
    const p=await product(slug,u,db);if(!p.owned&&!coach(u))throw problem(403,'Repertoire access required.');
    const floor=coach(u)?1:p.owned,selected=v==null?p.current_version:Number(v);
    if(!Number.isInteger(selected)||selected<floor||selected>p.current_version)throw problem(403,'Version unavailable.');
    return {p,v:selected,floor};
  }
  async function progress(db,u,slug){
    const r=await db.query('SELECT card,state FROM opening_progress WHERE user_id=$1 AND product=$2',[u.id,slug]);return Object.fromEntries(r.rows.map(x=>[x.card,x.state]));
  }
  async function save(db,b,{seed=false}={}){
    if(!slugOK(b.slug)||typeof b.name!=='string'||!b.name.trim()||b.name.length>120||typeof b.description!=='string'||b.description.length>1600)throw problem(400,'Check the product name, description and identifier.');
    const price=Number(b.price);
    if(!Number.isInteger(price)||price<400||price>1000000||typeof b.published!=='boolean')throw problem(400,'Invalid price or publication state.');
    const cover=coverValue(b.cover);
    await lock(db,'opening/product/'+b.slug);
    const old=await one(db,'SELECT current_version,revision FROM opening_products WHERE slug=$1',[b.slug]);
    if(old&&seed)return;
    if((old?.revision??0)!==b.revision)throw problem(409,'This product changed. Reopen it before saving.');
    const prev=old&&await one(db,'SELECT pgn,fingerprint,side FROM opening_versions WHERE product=$1 AND version=$2',[b.slug,old.current_version]);
    const pgn=b.pgn||prev?.pgn;
    if(!pgn)throw problem(422,'Upload a PGN.');
    const sig=fingerprint(pgn,b.side),changed=sig!==prev?.fingerprint;
    const model=changed?compile(pgn,b.side):await version(b.slug,old.current_version,db);
    const v=(old?.current_version??0)+(changed?1:0),ref=b.previewRef||model.lines[0],sample=preview(model,ref,b.previewDepth);
    const args=[b.slug,b.name.trim(),b.description.trim(),cover,price,b.published,v,JSON.stringify(model.stats),JSON.stringify(sample),JSON.stringify(ref),b.previewDepth];
    await db.query('INSERT INTO opening_products(slug,name,description,cover,price,published,current_version,stats,preview,preview_ref,preview_depth) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(slug) DO UPDATE SET name=$2,description=$3,cover=$4,price=$5,published=$6,current_version=$7,stats=$8,preview=$9,preview_ref=$10,preview_depth=$11,revision=opening_products.revision+1',args);
    if(changed)await db.query('INSERT INTO opening_versions(product,version,side,fingerprint,pgn,model) VALUES($1,$2,$3,$4,$5,$6)',[b.slug,v,b.side,sig,pgn,JSON.stringify(model)]);
    return {slug:b.slug,version:v,revision:(old?.revision??0)+1,stats:model.stats};
  }
  async function sessionView(row,model){
    const s=row.state;return {id:row.id,version:row.version,active:row.active,step:s.step,total:s.total,remaining:s.queue.length,
      prompt:row.active?prompt(model,s.queue[0]):null,summary:s.summary,feedback:s.feedback??null};
  }
  async function persist(db,row,model){
    await db.query('UPDATE opening_sessions SET state=$2,active=$3,updated_at=now() WHERE id=$1',[row.id,JSON.stringify(row.state),row.active]);return sessionView(row,model);
  }
  return {
    version,product,access,save,
    async init(seedValue=process.env.TCA_SICILIAN_PGN_GZIP){
      const schema=await readFile(new URL('./openings.sql',import.meta.url),'utf8');
      await transaction(pool,async db=>{
        await lock(db,'opening/schema/1');await db.query(schema);
        if(seedValue&&!await one(db,"SELECT 1 FROM opening_products WHERE slug='aggressive-sicilian'")){
          const pgn=gunzipSync(Buffer.from(seedValue,'base64'),{maxOutputLength:1048576}).toString('utf8');
          await save(db,{slug:'aggressive-sicilian',name:'Aggressive Sicilian',description:'A Black repertoire against 1.e4, from early sidelines and the Alapin to the Rossolimo and the Open Sicilian.',price:2900,side:'b',cover:'sicilian',published:true,pgn,revision:0,previewDepth:8},{seed:true});
        }
      });
    },
    async list(u){const r=await pool.query('SELECT * FROM ('+selector+') q WHERE published OR owned IS NOT NULL OR $2 ORDER BY name',[u?.id??null,coach(u)]);return r.rows.map(p=>catalogRow(p,u));},
    async detail(slug,u,v){
      const p=await product(slug,u);const out={...catalogRow(p,u),preview:p.preview};
      if(out.allowed){const a=await access(slug,u,v),m=await version(slug,a.v);
        out.version=a.v;out.versions=Array.from({length:p.current_version-a.floor+1},(_,i)=>p.current_version-i);
        out.stats=m.stats;out.side=m.side;out.progress=dashboard(m,await progress(pool,u,slug));
        const active=await one(pool,'SELECT id,version FROM opening_sessions WHERE user_id=$1 AND product=$2 AND active',[u.id,slug]);out.session=active||null;
      }return out;
    },
    async learn(slug,u,v){const a=await access(slug,u,v),m=await version(slug,a.v);return {version:a.v,side:m.side,chapters:m.chapters,lines:lineCatalogue(m)};},
    async adminProduct(slug,u){const p=await product(slug,u);const m=await version(slug,p.current_version);
      return {...catalogRow(p,u),previewRef:p.preview_ref,previewDepth:p.preview_depth,chapters:lineCatalogue(m)};},
    async manage(b){return transaction(pool,db=>save(db,b));},
    async start(slug,u,b){
      return transaction(pool,async db=>{
        await lock(db,'opening/session/'+u.id+'/'+slug);
        const a=await access(slug,u,b.version,db);
        const existing=await one(db,'SELECT * FROM opening_sessions WHERE user_id=$1 AND product=$2 AND active FOR UPDATE',[u.id,slug]);
        if(existing){await access(slug,u,existing.version,db);return sessionView(existing,await version(slug,existing.version,db));}
        const m=await version(slug,a.v,db),queue=plan(m,await progress(db,u,slug),b);
        if(!queue.length)throw problem(409,'Nothing is due with these session limits.');
        const state={queue,total:queue.length,line:b.line||null,seen:[],promoted:[],baseline:{},step:0,summary:{positions:0,hits:0,misses:0,improved:0,next:null}};
        const row=await one(db,'INSERT INTO opening_sessions(id,user_id,product,version,active,state) VALUES($1,$2,$3,$4,true,$5) RETURNING *',[randomUUID(),u.id,slug,a.v,JSON.stringify(state)]);
        return sessionView(row,m);
      });
    },
    async session(slug,id,u,action,b={}){
      return transaction(pool,async db=>{
        const row=await one(db,'SELECT * FROM opening_sessions WHERE id=$1 AND user_id=$2 AND product=$3 FOR UPDATE',[id,u.id,slug]);
        if(!row)throw problem(404,'Session not found.');
        await access(slug,u,row.version,db);const m=await version(slug,row.version,db),s=row.state;
        if(action==='get'||!row.active||b.step!==s.step)return sessionView(row,m);
        if(action==='finish'){row.active=false;s.queue=[];s.feedback=null;s.step++;return persist(db,row,m);}
        const ref=s.queue[0],result=moveResult(m,ref,b.move);
        if(['illegal','context'].includes(result.kind))return {...await sessionView(row,m),feedback:result};
        const prev=await progress(db,u,slug),old=prev[ref.key]||initial(),ok=result.kind==='correct',g=grade(old,ok,Date.now());
        await db.query('INSERT INTO opening_progress(user_id,product,card,state) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,product,card) DO UPDATE SET state=$4',[u.id,slug,ref.key,JSON.stringify(g)]);
        s.queue.shift();s.step++;s.summary[ok?'hits':'misses']++;
        if(!s.seen.includes(ref.key)){s.seen.push(ref.key);s.summary.positions++;}
        if(!(ref.key in s.baseline))s.baseline[ref.key]=old.level;
        if(ok&&g.level>s.baseline[ref.key]&&!s.promoted.includes(ref.key))s.promoted.push(ref.key);
        if(g.level<=s.baseline[ref.key])s.promoted=s.promoted.filter(k=>k!==ref.key);
        s.summary.improved=s.promoted.length;
        prev[ref.key]=g;
        if(ok)nextInLine(m,s,ref,result,prev);
        else if(!ref.retry)s.queue.splice(Math.min(2,s.queue.length),0,{...ref,retry:true});
        s.summary.next=dashboard(m,prev).next;s.feedback={...result,fen:m.chapters[ref.c].nodes[ref.n].fen};
        row.active=!!s.queue.length;return persist(db,row,m);
      });
    }
  };
}
