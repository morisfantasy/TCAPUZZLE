import Stripe from 'stripe';
import {randomUUID} from 'node:crypto';
import {transaction,lock} from './opening-store.mjs';
import {problem} from './opening-core.mjs';

const one=async(db,sql,args)=>(await db.query(sql,args)).rows[0];
export function paymentConfig(env=process.env){
  const mode=env.TCA_STRIPE_MODE==='live'?'live':'test',key=env.STRIPE_SECRET_KEY||'',secret=env.STRIPE_WEBHOOK_SECRET||'';
  const origin=env.TCA_OPENINGS_ORIGIN||(env.RAILWAY_PUBLIC_DOMAIN?'https://'+env.RAILWAY_PUBLIC_DOMAIN:'');
  const ready=key.startsWith('sk_'+mode+'_')&&secret.startsWith('whsec_')&&/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?$/i.test(origin)
    &&(mode==='test'||env.TCA_OPENINGS_ALLOW_LIVE==='true');
  const testUsers=(env.TCA_STRIPE_TEST_USERS||'').toLowerCase().split(',').map(v=>v.trim()).filter(Boolean);
  return {mode,origin,secret,ready,testUsers,client:ready?new Stripe(key,{maxNetworkRetries:1,timeout:12000}):null};
}
export function createPayments(pool,store,cfg=paymentConfig()){
  const permitted=u=>cfg.mode==='live'||!!u&&(['admin','superadmin'].includes(u.role)||(cfg.testUsers||[]).includes(u.username));
  function check(){if(!cfg.ready)throw problem(503,'Checkout is not configured.');}
  async function grantPaid(db,session){
    const id=session.client_reference_id;if(!/^[0-9a-f-]{36}$/i.test(id||''))return;
    const o=await one(db,'SELECT * FROM opening_orders WHERE id=$1 FOR UPDATE',[id]);
    if(!o||session.mode!=='payment'||session.payment_status!=='paid'||session.currency!=='hkd'||session.amount_total!==o.amount||
      session.metadata?.order!==o.id||session.metadata?.user!==String(o.user_id)||session.metadata?.product!==o.product||session.metadata?.version!==String(o.version)||
      !!session.livemode!==(o.mode==='live')||o.stripe_id&&o.stripe_id!==session.id||!session.payment_intent)return;
    if(['paid','refunded'].includes(o.status))return;
    const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent.id;
    await lock(db,'opening/intent/'+intent);
    const ref=await one(db,'SELECT amount FROM opening_stripe_refunds WHERE intent=$1',[intent]),amount=ref?.amount||0;
    await db.query('UPDATE opening_orders SET status=$2,intent=$3,stripe_id=$4,refund_amount=$5 WHERE id=$1',[id,amount>=o.amount?'refunded':'paid',intent,session.id,amount]);
    if(amount<o.amount)await db.query('INSERT INTO opening_access(user_id,product,version,source) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[o.user_id,o.product,o.version,id]);
  }
  async function refundEvent(db,c){
    const intent=c.payment_intent;if(!intent||c.currency!=='hkd'||!Number.isInteger(c.amount_refunded)||c.amount_refunded<=0)return;
    await lock(db,'opening/intent/'+intent);
    await db.query('INSERT INTO opening_stripe_refunds(intent,amount) VALUES($1,$2) ON CONFLICT(intent) DO UPDATE SET amount=GREATEST(opening_stripe_refunds.amount,EXCLUDED.amount)',[intent,c.amount_refunded]);
    const o=await one(db,'UPDATE opening_orders SET refund_amount=GREATEST(refund_amount,$2),status=CASE WHEN amount<=$2 THEN $3 ELSE status END WHERE intent=$1 RETURNING *',[intent,c.amount_refunded,'refunded']);
    if(o?.status==='refunded')await db.query('UPDATE opening_access SET active=false WHERE source=$1',[o.id]);
  }
  return {
    status:u=>({ready:cfg.ready&&permitted(u),mode:cfg.mode}),
    async checkout(slug,u){
      check();if(!permitted(u))throw problem(403,'Test checkout is limited to designated accounts.');
      const order=await transaction(pool,async db=>{
        await lock(db,'opening/checkout/'+u.id+'/'+slug);
        const p=await store.product(slug,u,db);
        if(!p.published||p.owned)throw problem(409,'This repertoire is unavailable to purchase.');
        if(await one(db,"SELECT 1 FROM opening_orders WHERE user_id=$1 AND product=$2 AND status='paid'",[u.id,slug]))throw problem(409,'This purchase already exists.');
        let old=await one(db,"SELECT * FROM opening_orders WHERE user_id=$1 AND product=$2 AND status='pending' FOR UPDATE",[u.id,slug]);
        if(old&&Date.now()-new Date(old.created_at).getTime()>=24*3600000){
          if(old.stripe_id){
            const remote=await cfg.client.checkout.sessions.retrieve(old.stripe_id);
            if(remote.status==='complete')throw problem(409,'Waiting for payment confirmation.');
            if(remote.status!=='expired')return old;
          }
          await db.query("UPDATE opening_orders SET status='expired' WHERE id=$1",[old.id]);old=null;
        }
        if(old&&old.mode!==cfg.mode)throw problem(409,'An earlier checkout is still pending.');
        if(old)return old;
        return one(db,'INSERT INTO opening_orders(id,user_id,product,version,amount,name,mode) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),u.id,slug,p.current_version,p.price,p.name,cfg.mode]);
      });
      if(order.checkout_url)return {url:order.checkout_url,mode:cfg.mode};
      const metadata={order:order.id,user:String(u.id),product:slug,version:String(order.version)};
      const back=cfg.origin+'/openings/'+slug;
      const session=await cfg.client.checkout.sessions.create({mode:'payment',payment_method_types:['card'],client_reference_id:order.id,metadata,
        payment_intent_data:{metadata},expires_at:Math.floor(new Date(order.created_at).getTime()/1000)+86400,
        success_url:back+'?checkout=return',cancel_url:back+'?checkout=cancelled',
        line_items:[{quantity:1,price_data:{currency:'hkd',unit_amount:order.amount,product_data:{name:order.name}}}]},{idempotencyKey:'opening-order-'+order.id});
      if(!session.url)throw problem(502,'Checkout could not be opened.');
      await pool.query('UPDATE opening_orders SET stripe_id=$2,checkout_url=$3,expires_at=to_timestamp($4) WHERE id=$1',[order.id,session.id,session.url,session.expires_at]);
      return {url:session.url,mode:cfg.mode};
    },
    async webhook(raw,signature){
      check();let event;try{event=cfg.client.webhooks.constructEvent(raw,signature,cfg.secret);}catch{throw problem(400,'Invalid webhook signature.');}
      if(!!event.livemode!==(cfg.mode==='live'))throw problem(400,'Unexpected Stripe mode.');
      await transaction(pool,async db=>{
        const first=await db.query('INSERT INTO opening_stripe_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id',[event.id]);if(!first.rowCount)return;
        const data=event.data.object;
        if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))await grantPaid(db,data);
        if(event.type==='charge.refunded')await refundEvent(db,data);
        if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type))await db.query("UPDATE opening_orders SET status='expired' WHERE stripe_id=$1 AND status='pending'",[data.id]);
      });return {received:true};
    },
    async refund(slug,id){
      check();const o=await one(pool,'SELECT * FROM opening_orders WHERE product=$1 AND id=$2',[slug,id]);
      if(!o||o.status!=='paid'||o.mode!==cfg.mode)throw problem(409,'This order cannot be refunded.');
      await cfg.client.refunds.create({payment_intent:o.intent},{idempotencyKey:'opening-refund-'+id});
      return {requested:true};
    }
  };
}
