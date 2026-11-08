import {compile,lineCatalogue,problem} from './opening-core.mjs';
import {createStore,coach,slugOK,lock,transaction} from './opening-store.mjs';
import {createPayments} from './opening-payments.mjs';

const uuid=s=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s||'');
async function rawBody(req,limit){
  let size=0;const parts=[];
  for await(const part of req){size+=part.length;if(size>limit)throw problem(413,'Upload is too large.');parts.push(part);}
  return Buffer.concat(parts);
}
export function createOpenings({pool,currentUser,readJson,json,payment}){
  const store=createStore(pool),payments=createPayments(pool,store,payment);
  async function api(req,url){
    const [first,second,third,fourth,...rest]=url.pathname.replace(/^\/api\/openings\/?/,'').split('/').filter(Boolean);
    const post=req.method==='POST';if(!post&&req.method!=='GET')throw problem(405,'Method not allowed.');
    if(rest.length)throw problem(404,'Not found.');
    if(first==='webhook'&&!second&&post)return payments.webhook(await rawBody(req,1000000),req.headers['stripe-signature']);
    if(post){
      if((req.headers['content-type']||'').split(';')[0]!=='application/json')throw problem(415,'Send JSON.');
      if(req.headers.origin){let host;try{host=new URL(req.headers.origin).host;}catch{}if(host!==req.headers.host)throw problem(403,'Invalid origin.');}
    }
    const u=await currentUser(req),body=post?await readJson(req,first==='admin'?1600000:4096):{};
    const login=()=>{if(!u)throw problem(401,'Please sign in.');};
    if(!first&&!post)return {products:await store.list(u),payment:payments.status(u)};
    if(first==='purchases'&&!second&&!post){
      login();return (await pool.query('SELECT o.id,o.product,o.name,o.version,o.amount,o.status,o.refund_amount,o.created_at,o.mode FROM opening_orders o WHERE user_id=$1 ORDER BY created_at DESC',[u.id])).rows;
    }
    if(first==='admin'){
      login();if(!coach(u))throw problem(403,'Coach access required.');
      if(second==='validate'&&!third&&post){
        let pgn=body.pgn;
        if(!pgn&&slugOK(body.slug)){const r=await pool.query('SELECT v.pgn FROM opening_products p JOIN opening_versions v ON v.product=p.slug AND v.version=p.current_version WHERE p.slug=$1',[body.slug]);pgn=r.rows[0]?.pgn;}
        const m=compile(pgn,body.side);return {stats:m.stats,chapters:lineCatalogue(m)};
      }
      if(second==='save'&&!third&&post)return store.manage(body);
      if(!slugOK(second))throw problem(404,'Not found.');
      if(!third&&!post)return store.adminProduct(second,u);
      if(third==='access'&&!fourth){
        if(!post){
          const grants=await pool.query('SELECT u.username,a.source,a.version,a.active,a.created_at FROM opening_access a JOIN users u ON u.id=a.user_id WHERE product=$1 ORDER BY a.created_at DESC',[second]);
          const orders=await pool.query('SELECT o.id,u.username,o.amount,o.version,o.status,o.refund_amount,o.mode,o.created_at FROM opening_orders o JOIN users u ON u.id=o.user_id WHERE product=$1 ORDER BY o.created_at DESC',[second]);
          return {grants:grants.rows,orders:orders.rows};
        }
        if(typeof body.username!=='string'||typeof body.grant!=='boolean')throw problem(400,'Choose a user and access action.');
        return transaction(pool,async db=>{
          const p=await store.product(second,u,db),target=(await db.query('SELECT id FROM users WHERE username=$1',[body.username.trim().toLowerCase()])).rows[0];
          if(!target)throw problem(404,'User not found.');
          await lock(db,'opening/checkout/'+target.id+'/'+second);
          if(body.grant)await db.query("INSERT INTO opening_access(user_id,product,version,source) VALUES($1,$2,$3,'grant') ON CONFLICT(user_id,product,source) DO UPDATE SET active=true,version=LEAST(opening_access.version,EXCLUDED.version)",[target.id,second,p.current_version]);
          else await db.query('UPDATE opening_access SET active=false WHERE user_id=$1 AND product=$2',[target.id,second]);
          return {updated:true};
        });
      }
      if(third==='refund'&&uuid(fourth)&&post)return payments.refund(second,fourth);
      throw problem(404,'Not found.');
    }
    if(!slugOK(first))throw problem(404,'Not found.');
    const v=url.searchParams.get('version');
    if(!second&&!post)return {...await store.detail(first,u,v),payment:payments.status(u)};
    if(second==='learn'&&!third&&!post)return store.learn(first,u,v);
    login();
    if(second==='checkout'&&!third&&post)return payments.checkout(first,u);
    if(second==='sessions'){
      if(post&&!third)return store.start(first,u,body);
      if(uuid(third)&&((!post&&!fourth)||(post&&['answer','finish'].includes(fourth))))return store.session(first,third,u,fourth||'get',body);
    }
    throw problem(404,'Not found.');
  }
  return {init:v=>store.init(v),async handle(req,res,url){try{json(res,200,await api(req,url));}catch(e){
    if(!e.status)console.error('Openings request failed',e.code||e.type||e.name);
    json(res,e.status||502,{error:e.status?e.message:'The request could not be completed.'});
  }}};
}
