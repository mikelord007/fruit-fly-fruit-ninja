import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMotorUI} from '../src/motor-ui.js';
import {createMemory} from '../src/fruit-memory.js';
import {createMotorSwarm,serializeMotorSwarm} from '../src/motor3d.js';
import {createGame,order,stepGame,chop,RECIPES} from '../src/salad-game.js';
const raw=JSON.parse(readFileSync(new URL('../data/circuit.json',import.meta.url)));
const policy=JSON.parse(readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

for(const saved of [null,policy,serializeMotorSwarm(createMotorSwarm(raw))])test(`learned flight starts after policy loading and preserves ${saved===null?'the starter lesson':saved.trained?'a saved lesson':'erased weights'}`,async()=>{
  const elements=new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(([tag,id])=>[id,{disabled:/\bdisabled\b/.test(tag),value:'',textContent:'',hidden:false}]));
  const previous={document:globalThis.document,fetch:globalThis.fetch,localStorage:globalThis.localStorage};
  let finishFetch,observedMode;
  globalThis.document={getElementById:id=>elements.get(id)};
  globalThis.localStorage={getItem:()=>saved===null?null:JSON.stringify(saved)};
  globalThis.fetch=()=>new Promise(resolve=>{finishFetch=resolve;});
  try{
    const loading=createMotorUI(raw,createMemory(raw),{onChange:mode=>observedMode=mode,onRestart:()=>{}});
    const select=elements.get('motorMode');
    assert.equal(select.disabled,true,'a cold load cannot accept an unhandled choice');
    assert.equal(select.onchange,undefined);
    assert.match(html,/<option value="learned" selected>/);
    assert.match(html,/<option value="motor" selected>/);
    finishFetch({ok:true,json:async()=>policy});
    const ui=await loading;
    assert.equal(select.disabled,false);
    assert.equal(select.value,'learned');
    assert.equal(ui.state.mode,'learned');
    assert.deepEqual(serializeMotorSwarm(ui.state.swarm),saved??policy);
    const game=createGame(createMemory(raw),{motorMode:ui.state.mode,motorSwarm:ui.state.swarm});
    order(game,RECIPES[0]);
    for(let i=0;i<60*120&&game.phase!=='served';i++){
      stepGame(game);if(game.phase==='ready')chop(game);
    }
    assert.equal(game.served,ui.state.swarm.trained?1:0,'the initial controller uses the loaded flight weights');
    select.value='autopilot';select.onchange();
    assert.equal(observedMode,'autopilot');
    assert.equal(ui.state.mode,'autopilot');
  }finally{
    for(const [key,value] of Object.entries(previous)){
      if(value===undefined)delete globalThis[key];else globalThis[key]=value;
    }
  }
});
