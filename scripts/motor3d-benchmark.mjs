import fs from 'node:fs';
import {motorActions,deserializeMotorSwarm,motorRng,randomMotorWorld,serializeMotorSwarm,createMotorSwarm} from '../src/motor3d.js';
import {createFlightWorld,stepKnife,knifeSettled,teacherMotorActions,yawQuaternion} from '../src/flight3d.js';
const circuit=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url)));
const saved=JSON.parse(fs.readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
const modes=['autopilot','learned','untrained','clamped','scrambled'];
const results={schema:1,trainingSeed:saved.training.seed,evaluationSeed:880031,heldOutStates:300,scope:'Attached rigid-body force/torque, staged free-flight navigation excluded',limits:'Synthetic encoded state and teacher imitation; no claim of biological motor reconstruction. All crews share the fitted readout.',modes:{}};
for(const mode of modes){
 const swarm=deserializeMotorSwarm(circuit,saved),rand=motorRng(results.evaluationSeed);let sq=0,count=0;
 for(let j=0;j<results.heldOutStates;j++){const w=randomMotorWorld(rand),actual=motorActions(swarm,w,mode),teacher=teacherMotorActions(w);for(let i=0;i<8;i++)for(const key of ['fx','fy','fz','tx','ty','tz']){sq+=(actual[i][key]-teacher[i][key])**2;count++;}}
 let success=0,error=0,maxError=0;const cases=[];
 for(let n=2;n<=8;n++)for(let k=0;k<4;k++){
  const w=createFlightWorld();w.flies.forEach((f,i)=>{f.enabled=i<n;f.attachment=-1.15+2.3*i/(n-1);});
  w.target={x:(k%2?1:-1)*.5,y:1.4+k*.25,z:-.2+k*.15,yaw:(k-1.5)*.2};
  for(let j=0;j<1200;j++)stepKnife(w,1/120,motorActions(swarm,w,mode));
  const e=Math.hypot(w.x-w.target.x,w.y-w.target.y,w.z-w.target.z);error+=e;maxError=Math.max(maxError,e);if(knifeSettled(w))success++;cases.push({crew:n,case:k,error:e,settled:knifeSettled(w)});
 }
 let stressSettled=0,stressError=0;const stressCases=[];const stressRand=motorRng(190031);
 for(let k=0;k<14;k++){
  const w=randomMotorWorld(stressRand);w.mass=.35+stressRand()*1.15;w.inertia=w.mass*2.8**2/12;w.vx*=1.5;w.vy*=1.5;w.vz*=1.5;
  for(let j=0;j<1800;j++){if(j===600){w.vx+=1.2;w.vz-=.8;w.angularVelocity.x+=.6;}stepKnife(w,1/120,motorActions(swarm,w,mode));}
  const e=Math.hypot(w.x-w.target.x,w.y-w.target.y,w.z-w.target.z);stressError+=e;if(knifeSettled(w))stressSettled++;stressCases.push({mass:w.mass,crew:w.flies.filter(f=>f.enabled).length,error:e,settled:knifeSettled(w)});
 }
 results.modes[mode]={stress:{seed:190031,description:'Unseen masses .35 to 1.5 (training .55), 1.5x initial velocities, lateral/angular impulse at 5s, 15s rollout',settled:stressSettled,cases:stressCases,meanFinalPositionError:stressError/stressCases.length},forceTorqueRMSE:Math.sqrt(sq/count),settled:success,cases:cases.length,meanFinalPositionError:error/cases.length,maxFinalPositionError:maxError};
}
fs.writeFileSync(new URL('../evidence/motor3d-benchmark.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
