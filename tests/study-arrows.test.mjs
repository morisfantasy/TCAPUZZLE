import test from 'node:test';
import assert from 'node:assert/strict';
import {arrowRoute,arrowOutline,nearArrow} from '../src/study-arrows.mjs';

test('all eight knight arrows have a two-square stem, one-square turn and integrated precise tip on both orientations',()=>{
  const moves=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  for(const flip of [false,true])for(const [dx,dy] of moves) {
    const origin=flip?[3.5,4.5]:[4.5,3.5], sign=flip?-1:1;
    const goal=[origin[0]+sign*dx,origin[1]+sign*dy],route=arrowRoute(origin,goal),elbow=route[1];
    assert.equal(route.length,3);assert.equal(Math.hypot(elbow[0]-origin[0],elbow[1]-origin[1]),2);
    assert.equal(Math.hypot(goal[0]-elbow[0],goal[1]-elbow[1]),1);
    assert.ok(nearArrow(goal,route));assert.ok(nearArrow([.5*(origin[0]+elbow[0]),.5*(origin[1]+elbow[1])],route));
    assert.equal(nearArrow([.5*(origin[0]+goal[0]),.5*(origin[1]+goal[1])],route),false);
    const outline=arrowOutline(route);
    assert.ok(outline.includes(' L'+goal.join(' ')+' L'));assert.equal((outline.match(/M/g)||[]).length,1);assert.match(outline,/ Z$/);
    assert.equal((outline.match(/ Q/g)||[]).length,4);
  }
});
test('straight horizontal, vertical and diagonal arrows terminate at the square centre and remain clickable',()=>{
  const from=[.5,.5];
  for(const to of [[.5,1.5],[4.5,.5],[4.5,4.5]]) {
    const route=arrowRoute(from,to);assert.deepEqual(route,[from,to]);
    const outline=arrowOutline(route);assert.ok(outline.includes(' L'+to.join(' ')+' L'));assert.equal((outline.match(/ Q/g)||[]).length,2);
    assert.ok(nearArrow([.5*(from[0]+to[0]),.5*(from[1]+to[1])],route));assert.equal(nearArrow([7.5,7.5],route),false);
  }
});
