import {writeFile} from 'node:fs/promises';
import {createWorld, baselineForces, stepWorld, applyGust, DT, MAX_FORCE} from '../src/physics.js';
const trials=[];
for(let i=0;i<20;i++) {
  const options={seed:800+i,mass:0.6+1.4*i/19,angle:-0.5+i*0.05,target:{x:i%2?3:-3,y:1.7+(i%3)*0.4},disabled:i%3===0?[1,6]:i%3===1?[i%8]:[]};
  const world=createWorld(options); let maxForce=0,maxTilt=0;
  for(let k=0;k<1200;k++) {
    if(k===240)applyGust(world,0.5+(i%10)*0.1);
    stepWorld(world,baselineForces(world),DT);
    maxTilt=Math.max(maxTilt,Math.abs(world.angle));
    for(const f of world.flies)maxForce=Math.max(maxForce,Math.hypot(f.fx,f.fy));
    if(![world.x,world.y,world.angle,world.vx,world.vy,world.omega].every(Number.isFinite))throw Error('Non-finite state');
  }
  trials.push({options,success:world.success,finalDistance:world.distance,finalTilt:world.angle,maxTilt,maxForce});
}
const summary={description:'Ten-second physical trials, deterministic impulse at 2 s; normalized units.',trials:trials.length,successes:trials.filter(t=>t.success).length,forceBound:MAX_FORCE,maxObservedForce:Math.max(...trials.map(t=>t.maxForce)),results:trials};
await writeFile(new URL('../evidence/physics-results.json',import.meta.url),JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,results:undefined},null,2));
if(summary.successes!==20)process.exitCode=1;
