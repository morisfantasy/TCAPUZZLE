// Integration checks against the isolated, disposable PostgreSQL schema from browser.cjs.
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {createStore} from '../src/opening-store.mjs';
import {createPayments} from '../src/opening-payments.mjs';

export async function verifyStore(db){
  const store=createStore(db),pupil=(await db.query("SELECT id,role,username FROM users WHERE username='pupil'")).rows[0];
  const prod={revision:0,slug:'billing-fixture',name:'Checkout fixture',description:'',side:'b',cover:'mint',price:2900,published:true,previewDepth:1,pgn:'1. e4 c5 (1... e5) 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 *'};
  await store.manage(prod);const slug=prod.slug;
  await assert.rejects(store.learn(slug,pupil),{status:403});
  const cfg={ready:true,mode:'test',secret:'whsec_local_only',testUsers:['pupil'],origin:'https://academy.test'};
  const stripe=new Stripe('sk_test_local_only'),byKey=new Map();let created,refunds=0;
  cfg.client={webhooks:stripe.webhooks,checkout:{sessions:{async create(body,options){
    if(!byKey.has(options.idempotencyKey))byKey.set(options.idempotencyKey,{id:'cs_test_local',url:'https://checkout.stripe.com/fixture',expires_at:body.expires_at});
    created=body;return byKey.get(options.idempotencyKey);
  }}},refunds:{async create(){refunds++;return {status:'pending'};}}};
  const pay=createPayments(db,store,cfg);const [a,b]=await Promise.all([pay.checkout(slug,pupil),pay.checkout(slug,pupil)]);
  assert.equal(a.url,b.url);assert.equal(byKey.size,1);assert.equal(created.line_items[0].price_data.unit_amount,2900);
  assert.equal((await db.query('SELECT count(*)::int n FROM opening_orders WHERE product=$1',[slug])).rows[0].n,1);
  await assert.rejects(store.learn(slug,pupil),{status:403});
  let seq=0;async function event(type,object,eventId='evt_'+(++seq)){
    const raw=JSON.stringify({id:eventId,type,livemode:false,data:{object}});
    const sig=stripe.webhooks.generateTestHeaderString({payload:raw,secret:cfg.secret});
    await pay.webhook(Buffer.from(raw),sig);
  }
  const session={id:'cs_test_local',mode:'payment',livemode:false,client_reference_id:created.client_reference_id,metadata:created.metadata,payment_status:'paid',currency:'hkd',amount_total:2900,payment_intent:'pi_fixture'};
  await assert.rejects(pay.webhook(Buffer.from('{}'),'invalid'),{status:400});
  await event('checkout.session.completed',{...session,amount_total:2000});await assert.rejects(store.learn(slug,pupil),{status:403});
  await event('checkout.session.completed',{...session,payment_status:'unpaid'});await assert.rejects(store.learn(slug,pupil),{status:403});
  await event('checkout.session.completed',session,'evt_fulfill');await event('checkout.session.completed',session,'evt_fulfill');
  assert.equal((await store.learn(slug,pupil)).version,1);await assert.rejects(pay.checkout(slug,pupil),{status:409});
  let s=await store.start(slug,pupil,{limit:3,newLimit:3});const id=s.id;
  assert.equal((await store.start(slug,pupil,{limit:3,newLimit:3})).id,id);
  s=await store.session(slug,id,pupil,'answer',{step:0,move:'e7e4'});assert.equal(s.step,0);assert.equal(s.feedback.kind,'illegal');
  const [firstMiss,dupe]=await Promise.all([1,2].map(()=>store.session(slug,id,pupil,'answer',{step:0,move:'a7a6'})));
  s=firstMiss;assert.equal(s.feedback.kind,'miss');assert.equal(s.summary.misses,1);assert.equal(dupe.summary.misses,1);assert.equal(dupe.step,1);
  const freshProcess=createStore(db);assert.equal((await freshProcess.session(slug,id,pupil,'get')).step,1);
  const answers=['d7d6','c5d4','c7c5'];
  for(const move of answers){s=await freshProcess.session(slug,id,pupil,'answer',{step:s.step,move});assert.equal(s.feedback.kind,'correct');}
  assert.equal(s.active,false);assert.equal(s.summary.positions,3);assert.equal(s.summary.hits,3);assert.equal(s.summary.misses,1);
  const before=(await store.detail(slug,pupil)).progress;assert.equal(before.new,1);
  await store.manage({...prod,revision:1,pgn:prod.pgn.replace('Nf6 *','Nf6 5. Nc3 a6 *')});
  const detail=await freshProcess.detail(slug,pupil);assert.deepEqual(detail.versions,[2,1]);assert.equal(detail.progress.new,before.new+1);
  assert.equal((await freshProcess.detail(slug,pupil,1)).progress.new,before.new);
  await assert.rejects(store.manage({...prod,revision:1}),{status:409});
  await store.manage({...prod,revision:2,pgn:'',published:false});
  assert.equal((await store.detail(slug,pupil)).published,false);await assert.rejects(store.detail(slug,null),{status:404});
  await pay.refund(slug,created.client_reference_id);assert.equal(refunds,1);
  await event('charge.refunded',{payment_intent:'pi_fixture',currency:'hkd',amount_refunded:100});
  assert.equal((await store.learn(slug,pupil,1)).version,1);
  await event('charge.refunded',{payment_intent:'pi_fixture',currency:'hkd',amount_refunded:2900});
  await event('checkout.session.completed',session);await assert.rejects(store.learn(slug,pupil),{status:404});
  const o=(await db.query('SELECT status,refund_amount FROM opening_orders WHERE id=$1',[created.client_reference_id])).rows[0];
  assert.deepEqual(o,{status:'refunded',refund_amount:2900});
  console.log('PASS PostgreSQL access control, one-time HKD checkout contract, signed test events, idempotency, partial/full refunds, version access, rep scheduling, session retries and storage across fresh instances');
}
