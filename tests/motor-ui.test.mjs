import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMotorUI} from '../src/motor-ui.js';
import {createMemory} from '../src/fruit-memory.js';
const raw=JSON.parse(readFileSync(new URL('../data/circuit.json',import.meta.url)));
const policy=JSON.parse(readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('flight selection is disabled until policy loading and mode handlers are ready',async()=>{
  const elements=new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(([tag,id])=>[id,{disabled:/\bdisabled\b/.test(tag),value:'',textContent:'',hidden:false}]));
  const previous={document:globalThis.document,fetch:globalThis.fetch,localStorage:globalThis.localStorage};
  let finishFetch,observedMode;
  globalThis.document={getElementById:id=>elements.get(id)};
  globalThis.localStorage={getItem:()=>null};
  globalThis.fetch=()=>new Promise(resolve=>{finishFetch=resolve;});
  try{
    const loading=createMotorUI(raw,createMemory(raw),{onChange:mode=>observedMode=mode,onRestart:()=>{}});
    const select=elements.get('motorMode');
    assert.equal(select.disabled,true,'a cold load cannot accept an unhandled choice');
    assert.equal(select.onchange,undefined);
    finishFetch({ok:true,json:async()=>policy});
    const ui=await loading;
    assert.equal(select.disabled,false);
    assert.equal(select.value,ui.state.mode);
    select.value='learned';select.onchange();
    assert.equal(observedMode,'learned');
    assert.equal(ui.state.mode,'learned');
    assert.equal(ui.state.swarm.trained,true);
  }finally{
    for(const [key,value] of Object.entries(previous)){
      if(value===undefined)delete globalThis[key];else globalThis[key]=value;
    }
  }
});
