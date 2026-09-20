import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMemory,responses,recruit,teach,resetMemory,changedSynapses} from '../src/fruit-memory.js';
import {createGame,order,stepGame,chop,timing,startRush,refreshCrew,bladeContact,RECIPES} from '../src/salad-game.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url)));
function play(g,max=60,perfect=true) {for(let n=0;n<max*120&&!['served','ended'].includes(g.phase);n++){stepGame(g);if(g.phase==='ready'&&(!perfect||timing(g)>.9))chop(g);}return g;}

test('fruit circuit uses 192 KC edges and does not mutate anatomical counts',()=>{
  const before=JSON.stringify(raw),m=createMemory(raw);teach(m,[0,4],3,6);
  assert.equal(m.kcIds.length,192);assert.equal(JSON.stringify(raw),before);
  assert.deepEqual(m.activity.map(a=>a.filter(v=>v>0).length),[15,15,15,15]);
});
test('starter tastes are learned and recruit distinct crews',()=>{
  const m=createMemory(raw);assert.deepEqual([0,1,2,3].map(f=>recruit(m,f)),[[0,3,6],[1,4,7],[2,5],[]]);
  assert.equal(m.history.length,8);assert.ok(m.history.every(h=>h.source==='starter'&&h.repetitions===6));
  resetMemory(m);for(let f=0;f<4;f++)assert.deepEqual(recruit(m,f),[]);
  for(let i=0;i<8;i++)for(const r of responses(m,i))assert.ok(Math.abs(r-.2)<1e-10);
});
test('snack training changes only eligible synapses of the selected chefs',()=>{
  const m=createMemory(raw),before=m.flies.map(f=>[...f.weights]);
  const changes=teach(m,[0,4],3,6);assert.deepEqual(recruit(m,3),[0,4]);assert.equal(new Set(changes.map(c=>`${c.fly}:${c.kc}`)).size,30);
  m.flies.forEach((fly,i)=>fly.weights.forEach((w,k)=>{
    if(![0,4].includes(i)||m.activity[3][k]===0)assert.equal(w,before[i][k]);
    assert.ok(Number.isFinite(w)&&w<=1.5*m.initial[k]);
  }));
});
test('resetting the learned weights abolishes volunteering; teaching recovers it',()=>{
  const m=createMemory(raw,{starter:false});teach(m,[1,7],3,6);assert.deepEqual(recruit(m,3),[1,7]);
  resetMemory(m);assert.deepEqual(recruit(m,3),[]);assert.equal(changedSynapses(m,1),0);
  teach(m,[1,7],3,6);assert.deepEqual(recruit(m,3),[1,7]);
});
test('fruit selectivity depends on anatomical PN→KC wiring',()=>{
  const changed=structuredClone(raw),pns=changed.neurons.filter(n=>n.role==='projection_neuron').map(n=>n.id).sort();
  changed.edges.filter(e=>e.relation==='pn_to_kc').forEach(e=>e.pre=pns[(pns.indexOf(e.pre)+17)%pns.length]);
  const a=createMemory(raw),b=createMemory(changed);
  assert.notDeepEqual(a.activity,b.activity);assert.notDeepEqual(responses(a,0),responses(b,0));
});
test('blade contact requires a moving downward edge that intersects fruit',()=>{
  const pose=(x,y)=>({x,y,angle:0});
  assert.equal(bladeContact(pose(0,1.6),pose(0,.1)),true,'swept fast cut');
  assert.equal(bladeContact(pose(0,.7),pose(0,.7)),false,'stationary overlap');
  assert.equal(bladeContact(pose(0,.2),pose(0,1.5)),false,'upward pass');
  assert.equal(bladeContact(pose(4,1.6),pose(4,.1)),false,'missed horizontally');
  assert.equal(bladeContact(pose(0,3),pose(0,2.5)),false,'missed overhead');
});
test('an untrained recipe waits without fabricated volunteers or cuts',()=>{
  const g=createGame(createMemory(raw));order(g,RECIPES[2]);play(g,10);
  assert.equal(g.phase,'waiting');assert.equal(g.cutCount,0);assert.deepEqual(g.crew,[]);
  teach(g.memory,[0,4],3,6);refreshCrew(g);play(g);assert.equal(g.phase,'served');assert.equal(g.cutCount,3);
});
test('every two-fly crew can physically lift, cut and return the knife',()=>{
  for(let a=0;a<8;a++)for(let b=a+1;b<8;b++){
    const m=createMemory(raw,{starter:false});teach(m,[a,b],3,6);
    const g=createGame(m);order(g,{name:'Pair test',fruits:[3]});play(g,15);
    assert.equal(g.phase,'served',`crew ${a},${b}`);assert.equal(g.cutCount,1);assert.ok(g.world.y<.28);assert.ok(Number.isFinite(g.world.angle));
  }
});
test('all recipes complete with exactly one blade-contact event per ingredient',()=>{
  const m=createMemory(raw);teach(m,[0,4],3,6);
  for(const recipe of RECIPES){const g=createGame(m);order(g,recipe);play(g);assert.equal(g.phase,'served');assert.equal(g.cutCount,recipe.fruits.length);assert.equal(g.events.filter(e=>e.type==='slice').length,recipe.fruits.length);assert.equal(g.served,1);}
});
test('cutting does not silently train preferences',()=>{
  const m=createMemory(raw),before=JSON.stringify(m.flies);const g=createGame(m);order(g,RECIPES[0]);play(g);assert.equal(JSON.stringify(m.flies),before);
});
test('timing earns a bonus but success still requires blade contact',()=>{
  const good=createGame(createMemory(raw)),early=createGame(createMemory(raw));
  order(good,{fruits:[0]});order(early,{fruits:[0]});play(good,15,true);play(early,15,false);
  assert.equal(good.cutCount,1);assert.equal(early.cutCount,1);assert.ok(good.score>early.score);
});
test('rush expires, freezes score and rejects orders and repeated chops',()=>{
  const g=createGame(createMemory(raw));assert.equal(startRush(g),true);order(g,RECIPES[0]);assert.equal(order(g,RECIPES[1]),false);assert.equal(chop(g),false);
  for(let n=0;n<10801;n++)stepGame(g);assert.equal(g.ended,true);assert.equal(g.phase,'ended');assert.equal(order(g,RECIPES[0]),false);const before=g.score;play(g,10);assert.equal(g.score,before);
});
