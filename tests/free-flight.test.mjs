import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vector3} from '../vendor/three/three.module.js';
import {createFlightWorld,dispatchCrew,stepFlyMotion,PERCHES,KNIFE_HOME} from '../src/flight3d.js';
import {deserializeMotorSwarm,createMotorSwarm,freeFlightAction} from '../src/motor3d.js';
import {createMemory} from '../src/fruit-memory.js';
import {createGame,order,stepGame,chop,gust} from '../src/salad-game.js';
const circuit=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url)));
const saved=JSON.parse(fs.readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
const lesson=()=>deserializeMotorSwarm(circuit,saved),dt=1/120;
const advance=(w,s,steps,mode='learned')=>{for(let j=0;j<steps;j++)stepFlyMotion(w,dt,(body,index)=>freeFlightAction(s,body,index,mode));};
const game=()=>createGame(createMemory(circuit),{motorMode:'learned',motorSwarm:lesson()});

test('each fly independently steers from its perch to a grip and back with bounded learned actions',()=>{
  const w=createFlightWorld(),s=lesson();dispatchCrew(w,[0,1,2,3,4,5,6,7]);advance(w,s,90);
  assert.notDeepEqual(s.agents[0].lastActivity,s.agents[1].lastActivity,'different body observations reach the circuit');
  for(let i=0;i<1200;i++){
    advance(w,s,1);
    for(const f of w.flies){assert.ok(Math.hypot(f.fx,f.fy,f.fz)<=8+1e-9);assert.ok(f.torque.length()<=.9+1e-9);assert.ok(Math.abs(f.orientation.length()-1)<1e-9);}
  }
  assert.ok(w.flies.every(f=>f.status==='attached'));
  dispatchCrew(w,[]);advance(w,s,1200);
  w.flies.forEach((f,i)=>{assert.equal(f.status,'perched');assert.ok(f.position.distanceTo(new Vector3(PERCHES[i].x,PERCHES[i].y,PERCHES[i].z))<1e-9);});
});

test('zero weights, untrained mode and clamped KCs cannot perform scripted navigation',()=>{
  for(const [s,mode] of [[createMotorSwarm(circuit),'learned'],[lesson(),'untrained'],[lesson(),'clamped'],[null,'learned']]){
    const w=createFlightWorld();dispatchCrew(w,[0,4]);advance(w,s,1200,mode);
    for(const i of [0,4]){const f=w.flies[i];assert.equal(f.status,'approach');assert.equal(f.position.x,PERCHES[i].x);assert.equal(f.position.z,PERCHES[i].z);assert.equal(f.fx,0);assert.equal(f.fy,0);}
  }
});

test('a physical displacement changes free-flight actions and the learned controller reacquires the grip',()=>{
  const a=createFlightWorld(),b=createFlightWorld(),sa=lesson(),sb=lesson();dispatchCrew(a,[0,4]);dispatchCrew(b,[0,4]);
  advance(a,sa,90);advance(b,sb,90);
  b.flies[0].position.x+=.8;b.flies[0].position.z+=.4;b.flies[0].flight.body.vx+=1.7;
  advance(a,sa,1);advance(b,sb,1);
  assert.ok(Math.abs(a.flies[0].fx-b.flies[0].fx)>.1);
  assert.ok(a.flies[0].position.distanceTo(b.flies[0].position)>.8,'no trajectory snap after a disturbance');
  advance(b,sb,1200);assert.ok([0,4].every(i=>b.flies[i].status==='attached'));
});

test('one erased chef cannot navigate even when its crew mates retain their lesson',()=>{
  const g=game();g.motorSwarm.agents[0].readout.forEach(row=>row.fill(0));order(g,{fruits:[0]});
  for(let i=0;i<1200;i++)stepGame(g);
  assert.equal(g.phase,'recruit');assert.equal(g.world.flies[0].status,'approach');assert.equal(g.world.flies[3].status,'attached');assert.equal(g.world.flies[6].status,'attached');assert.equal(g.world.x,KNIFE_HOME.x);
  g.motorSwarm.agents[0].readout=lesson().agents[0].readout;
  for(let i=0;i<1800&&g.phase!=='ready';i++)stepGame(g);
  assert.equal(g.phase,'ready');
});

test('knife banks physically in transit, levels for cutting and recovers from a gust without grip drift',()=>{
  const g=game();order(g,{fruits:[0]});let bank=0;
  for(let i=0;i<1800&&g.phase!=='ready';i++){
    stepGame(g);
    if(g.phase==='lift')bank=Math.max(bank,Math.acos(Math.min(1,new Vector3(0,1,0).applyQuaternion(g.world.orientation).y)));
  }
  assert.equal(g.phase,'ready');assert.ok(bank>.25,'visible tilt must come from integrated orientation');
  assert.ok(new Vector3(0,1,0).applyQuaternion(g.world.orientation).y>.995);
  assert.equal(gust(g),true);assert.equal(chop(g),false);
  for(let i=0;i<1800&&g.phase!=='ready';i++)stepGame(g);
  assert.equal(g.phase,'ready');assert.equal(chop(g),true);
  for(let i=0;i<1800&&g.phase!=='served';i++)stepGame(g);
  assert.equal(g.cutCount,1);assert.equal(g.served,1);
});
