// XYZ motor imitation. Only the PN→KC weights are anatomical; state encoding,
// tanh units and six linear force/torque outputs are engineered game controls.
import {Quaternion,Vector3} from '../vendor/three/three.module.js';
import {createFlightWorld,yawQuaternion,poseQuaternion,targetQuaternion,teacherMotorActions} from './flight3d.js';
import {fitRidge} from './ridge.js';
const ENCODING='xyz13-pn-kc-tanh-v1',FIELDS=['fx','fy','fz','tx','ty','tz'];
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function motorRng(seed){let s=seed>>>0||1;return()=>((s^=s<<13,s^=s>>>17,s^=s<<5)>>>0)/4294967296;}
export function createMotorSwarm(circuit){
  const pn=circuit.neurons.filter(n=>n.role==='projection_neuron').map(n=>String(n.id)),kc=circuit.neurons.filter(n=>n.role==='kenyon_cell').map(n=>String(n.id));
  const pi=new Map(pn.map((id,i)=>[id,i])),ki=new Map(kc.map((id,i)=>[id,i]));
  const incoming=kc.map(()=>[]),contacts=[];
  for(const e of circuit.edges)if(e.relation==='pn_to_kc'&&pi.has(String(e.pre))&&ki.has(String(e.post))){incoming[ki.get(String(e.post))].push([pi.get(String(e.pre)),Number(e.count)]);contacts.push(`${e.pre}:${e.post}:${e.count}`);}
  for(const row of incoming){const sum=row.reduce((s,e)=>s+e[1],0);for(const e of row)e[1]/=sum;}
  const encoder=pn.map(id=>Array.from({length:13},(_,j)=>Math.sin(hash(`${id}:motor3d:${j}`)*.000001)*.12));
  return {version:1,encodingId:ENCODING,topologyHash:hash(contacts.sort().join('|')),topo:{pn,kc,incoming},encoder,trained:false,agents:Array.from({length:8},()=>({readout:FIELDS.map(()=>Array(kc.length).fill(0)),lastActivity:kc.map(()=>0),lastPNActivity:pn.map(()=>0)}))};
}
export function motorObservation(w){
  const n=Math.max(1,w.flies.filter(f=>f.enabled).length),m=w.mass/.55/n,i=w.inertia/(.55*2.8**2/12)/n;
  const q=targetQuaternion(w).multiply(poseQuaternion(w).invert()),s=q.w<0?-1:1;
  return [(w.target.x-w.x)*m/6,(w.target.y-w.y)*m/6,(w.target.z-w.z)*m/6,w.vx*m/4,w.vy*m/4,w.vz*m/4,q.x*s*i,q.y*s*i,q.z*s*i,w.angularVelocity.x*i/3,w.angularVelocity.y*i/3,w.angularVelocity.z*i/3,m];
}
function activity(swarm,obs,mode){
  const pn=swarm.encoder.map(row=>Math.tanh(row.reduce((s,w,j)=>s+w*obs[j],0)));
  const rows=mode==='scrambled'?swarm.topo.incoming.map((_,i)=>swarm.topo.incoming[(i+37)%swarm.topo.incoming.length]):swarm.topo.incoming;
  const kc=rows.map(row=>Math.tanh(row.reduce((s,[p,w])=>s+pn[p]*w,0)));
  if(mode==='clamped')kc.fill(0);
  return {pn,kc};
}
function readAction(swarm,index,signals,mode){
  const zero=()=>Object.fromEntries(FIELDS.map(k=>[k,0]));
  if(!swarm)return zero();
  const a=swarm.agents[index],{pn,kc}=signals;
  a.lastPNActivity=[...pn];a.lastActivity=[...kc];
  const out=a.readout.map(row=>mode==='untrained'?0:row.reduce((s,w,j)=>s+w*kc[j],0));
  const f=new Vector3(...out.slice(0,3)).clampLength(0,8),t=new Vector3(...out.slice(3)).clampLength(0,.9);
  return {fx:f.x,fy:f.y,fz:f.z,tx:t.x,ty:t.y,tz:t.z};
}
// Each unattached fly observes its own body and applies its own readout. The
// mass-normalized encoding lets the existing XYZ lesson control a lighter body.
export function freeFlightAction(swarm,body,index,mode='learned'){
  if(mode==='autopilot')return teacherMotorActions(body)[0];
  return readAction(swarm,index,swarm?activity(swarm,motorObservation(body),mode):null,mode);
}
export function motorActions(swarm,world,mode='learned'){
  if(mode==='autopilot')return teacherMotorActions(world);
  if(!swarm) return world.flies.map(()=>Object.fromEntries(FIELDS.map(k=>[k,0])));
  const signals=activity(swarm,motorObservation(world),mode);
  return world.flies.map((fly,index)=>{
    if(!fly.enabled)return Object.fromEntries(FIELDS.map(k=>[k,0]));
    return readAction(swarm,index,signals,mode);
  });
}
export function randomMotorWorld(rand){
  const w=createFlightWorld(),n=2+Math.floor(rand()*7);
  w.flies.forEach((f,i)=>{f.enabled=i<n;f.attachment=-1.15+2.3*i/(n-1);});
  Object.assign(w,{x:(rand()-.5)*7,y:.5+rand()*2.5,z:-2.4+rand()*3.2,vx:(rand()-.5)*4,vy:(rand()-.5)*4,vz:(rand()-.5)*4});
  w.orientation.copy(yawQuaternion((rand()-.5)*1.6)).multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),(rand()-.5)*.6)).multiply(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),(rand()-.5)*.6));
  w.angularVelocity.set((rand()-.5)*2,(rand()-.5)*2,(rand()-.5)*2);
  w.target={x:(rand()-.5)*6,y:.5+rand()*2.5,z:-2+rand()*2.8,yaw:(rand()-.5)*1.4};return w;
}
export function trainMotorSwarm(circuit,options={},onProgress){
  const swarm=createMotorSwarm(circuit),seed=options.seed??9317,samples=options.samples??1800,lambda=options.ridgeLambda??1e-10,rand=motorRng(seed),xs=[],ys=[];
  for(let j=0;j<samples;j++){const w=randomMotorWorld(rand);xs.push(activity(swarm,motorObservation(w)).kc);const a=teacherMotorActions(w,{bounded:false})[0];ys.push(FIELDS.map(k=>a[k]));}
  const readout=[];
  for(let d=0;d<6;d+=2){const pair=fitRidge(xs,ys.map(y=>[y[d],y[d+1]]),lambda);readout.push(...pair.map(r=>Array.from(r)));onProgress?.({fraction:(d+2)/6,message:`Fitted ${d+2} of 6 motor outputs`});}
  for(const a of swarm.agents)a.readout=readout.map(r=>[...r]);
  swarm.trained=true;swarm.training={seed,samples,ridgeLambda:lambda,method:'Ridge imitation of unbounded analytic XYZ PD targets; same actuator saturation at runtime',sharedReadout:true,scope:'Mass-normalized force and torque for individual fly navigation and attached knife control; waypoints and bank targets are engineered',anatomy:'Raw PN→KC counts normalized per KC; fixed during fitting',engineered:['13 relative-state PN inputs','tanh activation','six force/torque readouts'],intercept:false};return swarm;
}
export function serializeMotorSwarm(s){return {version:1,encodingId:ENCODING,topologyHash:s.topologyHash,pnIds:s.topo.pn,kcIds:s.topo.kc,trained:s.trained,training:s.training,readouts:s.agents.map(a=>a.readout)};}
export function deserializeMotorSwarm(circuit,saved){
  const s=createMotorSwarm(circuit);
  if(saved?.version!==1||saved.encodingId!==ENCODING||saved.topologyHash!==s.topologyHash||saved.pnIds?.join('|')!==s.topo.pn.join('|')||saved.kcIds?.join('|')!==s.topo.kc.join('|'))throw new Error('Motor policy does not match the fixed circuit/encoding');
  if(!Array.isArray(saved.readouts)||saved.readouts.length!==8||saved.readouts.some(r=>!Array.isArray(r)||r.length!==6||r.some(row=>!Array.isArray(row)||row.length!==s.topo.kc.length||row.some(x=>!Number.isFinite(x)))))throw new Error('Invalid motor readout weights');
  saved.readouts.forEach((r,i)=>s.agents[i].readout=r.map(row=>[...row]));s.trained=!!saved.trained;s.training=saved.training;return s;
}
