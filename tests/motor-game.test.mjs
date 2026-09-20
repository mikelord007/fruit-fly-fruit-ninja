import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMemory,teach} from '../src/fruit-memory.js';
import {createGame,order,chop,timing,stepGame,setMotorMode,RECIPES} from '../src/salad-game.js';
import {createMotorSwarm,trainMotorSwarm,deserializeMotorSwarm} from '../src/motor3d.js';
const circuit=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url))),saved=JSON.parse(fs.readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
function advance(g,seconds,cut=true){for(let j=0;j<seconds*120&&g.phase!=='served';j++){stepGame(g);if(cut&&g.phase==='ready'&&timing(g)>.9)chop(g);}}
test('all three complete recipes run with learned force/torque and genuine blade contact',()=>{
 for(const recipe of RECIPES){const memory=createMemory(circuit);teach(memory,[0,4],3,6);const g=createGame(memory,{motorMode:'learned',motorSwarm:deserializeMotorSwarm(circuit,saved)});order(g,recipe);advance(g,60);assert.equal(g.served,1,recipe.name);assert.equal(g.cutCount,recipe.fruits.length);assert.equal(g.events.filter(e=>e.type==='slice').length,recipe.fruits.length);}
});
test('erasure stops navigation; fitting again recovers the same active order without changing fruit preferences',()=>{
 const memory=createMemory(circuit),weights=memory.flies.map(f=>[...f.weights]),g=createGame(memory,{motorMode:'learned',motorSwarm:createMotorSwarm(circuit)});order(g,{fruits:[0]});advance(g,8);assert.equal(g.phase,'recruit');assert.ok(g.crew.every(i=>g.world.flies[i].status==='approach'));assert.equal(g.cutCount,0);assert.ok(g.world.y<.4);
 const trained=trainMotorSwarm(circuit);setMotorMode(g,'learned',trained);advance(g,30);assert.equal(g.served,1);assert.deepEqual(memory.flies.map(f=>f.weights),weights);
});
test('switching an airborne trained crew to untrained preserves recruitment and preferences, then autopilot recovers',()=>{
 const memory=createMemory(circuit),g=createGame(memory,{motorMode:'learned',motorSwarm:deserializeMotorSwarm(circuit,saved)});order(g,{fruits:[0]});advance(g,8,false);assert.equal(g.phase,'ready');const crew=[...g.crew],weights=memory.flies.map(f=>[...f.weights]);setMotorMode(g,'untrained');assert.equal(g.phase,'lift');advance(g,3);assert.equal(g.cutCount,0);assert.ok(g.world.y<.4);assert.deepEqual(g.crew,crew);setMotorMode(g,'autopilot');advance(g,30);assert.equal(g.served,1);assert.deepEqual(memory.flies.map(f=>f.weights),weights);
});
test('erasing flight weights while ready disables chopping as the knife falls, then training recovers',()=>{
 const memory=createMemory(circuit),g=createGame(memory,{motorMode:'learned',motorSwarm:deserializeMotorSwarm(circuit,saved)});order(g,{fruits:[0]});advance(g,8,false);assert.equal(g.phase,'ready');
 setMotorMode(g,'learned',createMotorSwarm(circuit));advance(g,1,false);assert.equal(g.phase,'lift');assert.equal(chop(g),false);assert.equal(g.cutCount,0);
 setMotorMode(g,'learned',trainMotorSwarm(circuit));advance(g,30);assert.equal(g.served,1);assert.equal(g.cutCount,1);
});
