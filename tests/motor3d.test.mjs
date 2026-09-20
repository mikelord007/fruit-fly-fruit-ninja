import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMotorSwarm,trainMotorSwarm,serializeMotorSwarm,deserializeMotorSwarm,motorActions,randomMotorWorld,motorRng} from '../src/motor3d.js';
import {createFlightWorld,stepKnife,teacherMotorActions,knifeSettled} from '../src/flight3d.js';
const circuit=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url)));
const saved=JSON.parse(fs.readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
function world(){const w=createFlightWorld();w.flies.forEach((f,i)=>{f.enabled=i<2;f.attachment=i?1.15:-1.15;});w.target={x:0,y:1.85,z:0,yaw:0};return w;}
test('zero readouts and clamped KCs provide exactly zero XYZ motor output, without teacher fallback',()=>{
 const w=world(),empty=createMotorSwarm(circuit),trained=deserializeMotorSwarm(circuit,saved);
 for(const a of [motorActions(empty,w),motorActions(trained,w,'untrained'),motorActions(trained,w,'clamped'),motorActions(null,w,'learned')])assert.ok(a.every(f=>Object.values(f).every(x=>x===0)));
 assert.ok(teacherMotorActions(w).some(f=>Math.abs(f.fy)>1));
});
test('explicit zero action array drops the knife while omitted actions retain autopilot',()=>{
 const a=world(),b=world();for(let j=0;j<600;j++){stepKnife(a,1/120);stepKnife(b,1/120,motorActions(null,b,'untrained'));}
 assert.ok(knifeSettled(a));assert.ok(b.y<.35);assert.ok(Math.abs(b.x+3.1)<1e-9);
});
test('held-out six-dimensional actions imitate teacher across unseen states',()=>{
 const s=deserializeMotorSwarm(circuit,saved),rand=motorRng(478853);let square=0,count=0;const nonzero=Array(6).fill(false),keys=['fx','fy','fz','tx','ty','tz'];
 for(let j=0;j<120;j++){const w=randomMotorWorld(rand),a=motorActions(s,w),b=teacherMotorActions(w);for(let i=0;i<8;i++)keys.forEach((k,d)=>{square+=(a[i][k]-b[i][k])**2;count++;if(Math.abs(a[i][k])>.01)nonzero[d]=true;});}
 assert.ok(Math.sqrt(square/count)<.003);assert.ok(nonzero.every(Boolean));assert.equal(s.agents[0].lastActivity.length,192);assert.equal(s.agents[0].lastPNActivity.length,124);
});
test('learned controller settles actual XYZ rigid body for every allowed crew size',()=>{
 for(let n=2;n<=8;n++){const w=world(),s=deserializeMotorSwarm(circuit,saved);w.flies.forEach((f,i)=>{f.enabled=i<n;f.attachment=-1.15+2.3*i/(n-1);});for(let j=0;j<900;j++)stepKnife(w,1/120,motorActions(s,w));assert.ok(knifeSettled(w,.01,.03),`crew ${n}`);}
});
test('serialization verifies raw PN-KC counts and rejects malformed weights',()=>{
 const s=deserializeMotorSwarm(circuit,saved);assert.deepEqual(serializeMotorSwarm(s),saved);
 const altered=structuredClone(circuit);altered.edges.find(e=>e.relation==='pn_to_kc').count++;assert.throws(()=>deserializeMotorSwarm(altered,saved),/circuit/);
 const bad=structuredClone(saved);bad.readouts[0][0][0]=NaN;assert.throws(()=>deserializeMotorSwarm(circuit,bad),/weights/);
});
test('fitting is reproducible and changing anatomical KC inputs disrupts learned output',()=>{
 const a=trainMotorSwarm(circuit,{samples:250,seed:129}),b=trainMotorSwarm(circuit,{samples:250,seed:129});assert.deepEqual(serializeMotorSwarm(a),serializeMotorSwarm(b));
 const w=world(),before=motorActions(a,w);a.topo.incoming.forEach(row=>row.splice(0));const after=motorActions(a,w);assert.ok(before[0].fy>1);assert.ok(after.every(f=>Object.values(f).every(x=>x===0)));
});
test('six-output actions and physics reject non-finite commands and enforce vector bounds',()=>{
 const s=deserializeMotorSwarm(circuit,saved),w=world();s.agents.forEach(a=>a.readout.forEach(r=>r.fill(1e6)));const actions=motorActions(s,w);for(const a of actions){assert.ok(Math.hypot(a.fx,a.fy,a.fz)<=8.00000001);assert.ok(Math.hypot(a.tx,a.ty,a.tz)<=.90000001);}
 stepKnife(w,1/120,[{fx:Infinity,fy:NaN,fz:10000,tx:Infinity,ty:10000,tz:NaN}]);assert.ok(Number.isFinite(w.x+w.y+w.z));assert.ok(Math.hypot(w.flies[0].fx,w.flies[0].fy,w.flies[0].fz)<=8.00000001);assert.ok(w.flies[0].torque.length()<=.90000001);
 const malformed=structuredClone(saved);malformed.encodingId='old';assert.throws(()=>deserializeMotorSwarm(circuit,malformed),/encoding/);
});
test('permuting fixed KC inputs disrupts frozen readouts',()=>{
 const s=deserializeMotorSwarm(circuit,saved),w=world(),a=motorActions(s,w),b=motorActions(s,w,'scrambled');assert.ok(Math.hypot(a[0].fx-b[0].fx,a[0].fy-b[0].fy,a[0].fz-b[0].fz)>.5);
});
