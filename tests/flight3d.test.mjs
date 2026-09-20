import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Scene,Group,Vector3} from '../vendor/three/three.module.js';
import {PERCHES,KNIFE_HOME,createFlightWorld,transformPoint,gripPoint,stepFlyMotion,stepKnife,yawQuaternion} from '../src/flight3d.js';
import {createMemory,stepNeuralActivity,sniff,responses} from '../src/fruit-memory.js';
import {createGame,order,stepGame,bladeContact,chop} from '../src/salad-game.js';
import {syncFlyTransforms} from '../src/salad-scene.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url)));
const dt=1/120;
test('flies rest on eight distinct perches at different depths and heights',()=>{
  const w=createFlightWorld();for(let i=0;i<120;i++)stepFlyMotion(w,dt);
  assert.equal(new Set(PERCHES.map(p=>`${p.x},${p.y},${p.z}`)).size,8);
  assert.ok(Math.max(...PERCHES.map(p=>p.z))-Math.min(...PERCHES.map(p=>p.z))>3);
  assert.ok(Math.max(...PERCHES.map(p=>p.y))-Math.min(...PERCHES.map(p=>p.y))>5);
  w.flies.forEach((f,i)=>{assert.equal(f.status,'perched');assert.equal(f.position.distanceTo(new Vector3(PERCHES[i].x,PERCHES[i].y,PERCHES[i].z)),0);});
});
test('knife waits for every recruited chef to arrive before moving',()=>{
  const g=createGame(createMemory(raw));order(g,{fruits:[0]});let waited=0;
  while(g.phase==='recruit'&&waited<600){assert.ok(g.world.flies.every(f=>!f.enabled));assert.equal(g.world.x,KNIFE_HOME.x);assert.equal(g.world.y,KNIFE_HOME.y);assert.equal(g.world.z,KNIFE_HOME.z);stepGame(g,dt);waited++;}
  assert.equal(g.phase,'lift');assert.ok(waited>120);assert.ok(g.crew.every(i=>g.world.flies[i].status==='attached'));
});
test('pickup paths and knife movement change actual world Z',()=>{
  const g=createGame(createMemory(raw));order(g,{fruits:[0]});const z0=g.world.flies[0].position.z;let flyMoved=false;
  for(let i=0;i<1200&&g.phase!=='ready';i++){stepGame(g,dt);if(Math.abs(g.world.flies[0].position.z-z0)>.5)flyMoved=true;}
  assert.ok(flyMoved);assert.equal(g.phase,'ready');assert.ok(Math.abs(g.world.z-KNIFE_HOME.z)>1.5);assert.ok(Math.abs(g.world.vz)<.25);
});
test('carrier positions have zero relative drift through pickup, turn, cut and return',()=>{
  const g=createGame(createMemory(raw));order(g,{fruits:[0]});let attachedSteps=0;
  for(let i=0;i<2400&&g.phase!=='served';i++){
    stepGame(g,dt);if(g.phase==='ready')chop(g);
    for(const f of g.world.flies)if(f.status==='attached'){assert.ok(f.position.distanceTo(transformPoint(g.world,gripPoint(f)))<1e-10);attachedSteps++;}
  }
  assert.ok(attachedSteps>500);assert.equal(g.phase,'served');
  for(let i=0;i<400;i++)stepGame(g,dt);assert.ok(g.world.flies.every(f=>f.status==='perched'));
});
test('renderer shares the knife parent transform without interpolation lag',()=>{
  const g=createGame(createMemory(raw));order(g,{fruits:[0]});const scene=new Scene(),rig=new Group(),meshes=g.world.flies.map(()=>new Group());scene.add(rig);
  for(let i=0;i<650;i++){
    stepGame(g,dt);syncFlyTransforms(rig,scene,meshes,g.world);scene.updateMatrixWorld(true);
    g.world.flies.forEach((f,index)=>{assert.ok(meshes[index].getWorldPosition(new Vector3()).distanceTo(f.position)<1e-10);if(f.status==='attached')assert.equal(meshes[index].parent,rig);});
  }
});
test('a depth-separated blade cannot cut a fruit with the same screen-plane coordinates',()=>{
  const a={x:0,y:1.6,z:2,orientation:yawQuaternion(0)},b={x:0,y:.1,z:2,orientation:yawQuaternion(0)};
  assert.equal(bladeContact(a,b),false);
  assert.equal(bladeContact({...a,z:0},{...b,z:0}),true);
});
test('3D motor forces are bounded and cannot teleport the knife to its target',()=>{
  const w=createFlightWorld();w.target={x:2,y:3,z:1,yaw:.6};w.flies[0].enabled=true;w.flies[1].enabled=true;w.flies[0].attachment=-1;w.flies[1].attachment=1;
  stepKnife(w,dt);assert.ok(w.x<KNIFE_HOME.x+.01);assert.ok(w.z<KNIFE_HOME.z+.01);
  for(let i=0;i<500;i++){stepKnife(w,dt);for(const f of w.flies){assert.ok(Math.hypot(f.fx,f.fy,f.fz)<=8+1e-9);assert.ok(f.torque.length()<=.9+1e-9);}assert.ok(Math.abs(w.orientation.length()-1)<1e-9);}
  assert.ok(w.z>.8);assert.ok(w.orientation.angleTo(yawQuaternion(.6))<.03);
});
test('brain display rates follow odor activity and the selected fly learned weights',()=>{
  const m=createMemory(raw);for(let i=0;i<480;i++)stepNeuralActivity(m,0,dt);
  for(const f of m.flies)assert.equal(f.live.kc.filter(x=>x>.08).length,15);
  assert.ok(Math.abs(m.flies[0].live.mbon-responses(m,0)[0])<1e-5);
  assert.ok(m.flies[0].live.mbon>m.flies[1].live.mbon*2);
  for(let i=0;i<500;i++)stepNeuralActivity(m,null,dt);
  assert.ok(m.flies.every(f=>f.live.mbon<1e-6&&f.live.kc.every(x=>x<1e-6)));
});
test('sniffing activates only its recipient and never changes memories',()=>{
  const m=createMemory(raw),before=JSON.stringify(m.flies.map(f=>f.weights));sniff(m,4,3);
  for(let i=0;i<120;i++)stepNeuralActivity(m,null,dt);
  assert.equal(m.flies[4].live.kc.filter(x=>x>.08).length,15);assert.ok(m.flies[0].live.kc.every(x=>x===0));
  assert.equal(JSON.stringify(m.flies.map(f=>f.weights)),before);
});
