import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedPercent, ratingPeriod, initialRating } from '../src/rating.mjs';

const games=(ratings,scores)=>ratings.map((opponent,i)=>({opponent,score:scores[i]}));
const event=(month,scores,opponent=1800)=>({month,games:scores.map(score=>({opponent,score}))});

test('FIDE Arbiters Manual 2024, appendix p. 287, 2212 to 2268',()=>{
  const r=ratingPeriod(2212,40,games([1926,2011,2318,2067,2219,2585,2659,2464,2652],[1,1,0,.5,.5,0,1,.5,.5]));
  assert.deepEqual(r.rows.map(row=>row.expected),[84,76,36,69,49,10,8,19,8]);
  assert.deepEqual([r.raw,r.rounded,r.final],[56.4,56,2268]);
});
test('published rating governs both the 400 cap and the 2650 exception',()=>{
  assert.equal(expectedPercent(2649,1800),92); assert.equal(expectedPercent(2650,1800),100);
  assert.equal(expectedPercent(1800,2650),8); assert.equal(expectedPercent(2650,3386),0);
  assert.equal(expectedPercent(2000,2003),50); assert.equal(expectedPercent(2000,2004),49);
});
test('signed period rounding happens once, including negative halves',()=>{
  assert.equal(ratingPeriod(2000,10,games([2018,2000],[.5,.5])).raw,.3);
  assert.equal(ratingPeriod(2000,10,games([2033],[.5])).rounded,1);
  assert.equal(ratingPeriod(2033,10,games([2000],[.5])).rounded,-1);
  assert.equal(ratingPeriod(2033,10,games([2000,2000],[.5,.5])).rounded,-1);
});
test('K × n ≤ 700 counts played games for the whole period',()=>{
  const list=Array(18).fill({opponent:1800,score:1});
  assert.equal(ratingPeriod(1800,40,list).k,38);
  assert.equal(ratingPeriod(1800,40,[...list,{opponent:'',score:0}]).count,18);
});
test('five rated opponents and two virtual draws; 3/5 at 1800 gives 1850',()=>{
  const r=initialRating([event('2026-11',[1,1,.5,.5,0])],'2026-11');
  assert.deepEqual([r.count,r.score,r.percent,r.dp,r.value,r.eligible],[5,3,57,50,1850,true]);
  assert.equal(initialRating([event('2026-11',[1,1,0,0,.5])],'2026-11').value,1800);
});
test('zero-score opening events are discarded, later losses pool, unrated games do not count',()=>{
  const tournaments=[event('2026-02',[0,0]),event('2026-03',[.5,0]),event('2026-03',[0,0,0]),event('2026-04',[1],0)];
  const r=initialRating(tournaments,'2026-04'); assert.deepEqual([r.count,r.score,r.zeroGames,r.eligible],[5,.5,2,true]);
  const z=initialRating([event('2026-11',[0,0,0,0,0])],'2026-11'); assert.deepEqual([z.count,z.value,z.eligible],[0,null,false]);
});
test('the 26-month pool includes the first and last of 26 lists and excludes future results',()=>{
  const tournaments=[event('2024-09',[1]),event('2024-10',[1]),event('2026-11',[.5,0,1,.5]),event('2026-12',[1])];
  const r=initialRating(tournaments,'2026-11');assert.deepEqual([r.count,r.outside,r.eligible],[5,2,true]);
});
test('publication floor, ceiling, four games and incomplete fields',()=>{
  assert.equal(initialRating([event('2026-11',[.5,0,0,0,0],1400)],'2026-11').eligible,false);
  assert.equal(initialRating([event('2026-11',[1,1,1,1,1],2700)],'2026-11').value,2200);
  const r=initialRating([event('2026-11',[1,1,1,1,null])],'2026-11');assert.deepEqual([r.count,r.eligible],[4,false]);
});
