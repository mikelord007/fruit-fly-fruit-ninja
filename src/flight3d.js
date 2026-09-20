import {Quaternion, Vector3} from '../vendor/three/three.module.js';

export const KNIFE_HOME = Object.freeze({x:-3.1,y:.32,z:-1.8,yaw:-.42});
export const PERCHES = Object.freeze([
  {x:-4.45,y:3.61,z:-2.92,yaw:-1.2,name:'Window sill'},
  {x:2.2,y:5.58,z:-2.88,yaw:.8,name:'Marmalade jar'},
  {x:-3.55,y:2.36,z:-1.8,yaw:-.6,name:'Little shelf'},
  {x:-5.35,y:.18,z:.22,yaw:2.4,name:'Left counter edge'},
  {x:3.6,y:4.89,z:-2.7,yaw:1.7,name:'High shelf'},
  {x:4.65,y:5.44,z:-2.88,yaw:2.6,name:'Mug rim'},
  {x:4.4,y:.18,z:.23,yaw:-2.4,name:'Front counter edge'},
  {x:4.5,y:2.72,z:-1.2,yaw:1.5,name:'Side shelf'},
]);
const v=p=>new Vector3(p.x,p.y,p.z??0);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function yawQuaternion(yaw=0) {return new Quaternion().setFromAxisAngle(new Vector3(0,1,0),yaw);}
export function poseQuaternion(pose) {return pose.orientation?new Quaternion().copy(pose.orientation):new Quaternion().setFromAxisAngle(new Vector3(0,0,1),pose.angle??0);}
export function transformPoint(world,point) {return v(point).applyQuaternion(poseQuaternion(world)).add(v(world));}
export function gripPoint(fly) {return {x:fly.attachment,y:.34,z:fly.gripZ};}
export function createFlightWorld() {
  return {...KNIFE_HOME,vx:0,vy:0,vz:0,orientation:yawQuaternion(KNIFE_HOME.yaw),angularVelocity:new Vector3(),angle:0,mass:.55,inertia:.55*2.8**2/12,time:0,target:{...KNIFE_HOME},flies:PERCHES.map((perch,index)=>({index,enabled:false,attachment:0,gripZ:0,fx:0,fy:0,fz:0,torque:new Vector3(),position:v(perch),orientation:yawQuaternion(perch.yaw),status:'perched',flight:null}))};
}

// A full XYZ rigid body with quaternion orientation. Grip motors supply bounded
// forces and torques; these are engineered actuators, not insect aerodynamics.
export function stepKnife(world,dt) {
  const active=world.flies.filter(f=>f.enabled);
  const totalForce=new Vector3(0,-9.81*world.mass,0),totalTorque=new Vector3();
  const desiredForce=new Vector3(
    5.3*(world.target.x-world.x)-3.8*world.vx,
    9.81+6.5*(world.target.y-world.y)-4.2*world.vy,
    5.3*(world.target.z-world.z)-3.8*world.vz,
  ).multiplyScalar(world.mass);
  const error=yawQuaternion(world.target.yaw).multiply(poseQuaternion(world).invert());
  const sign=error.w<0?-1:1;
  const desiredTorque=new Vector3(error.x,error.y,error.z).multiplyScalar(30*sign)
    .addScaledVector(world.angularVelocity,-7).multiplyScalar(world.inertia);
  for(const fly of world.flies) {
    const force=fly.enabled?desiredForce.clone().divideScalar(active.length).clampLength(0,8):new Vector3();
    const torque=fly.enabled?desiredTorque.clone().divideScalar(active.length).clampLength(0,.9):new Vector3();
    fly.fx=force.x;fly.fy=force.y;fly.fz=force.z;fly.torque.copy(torque);
    totalForce.add(force);
    const arm=new Vector3(fly.attachment,0,0).applyQuaternion(world.orientation);
    totalTorque.add(arm.cross(force)).add(torque);
  }
  totalForce.addScaledVector(new Vector3(world.vx,world.vy,world.vz),-.25*world.mass);
  world.vx+=totalForce.x/world.mass*dt;world.vy+=totalForce.y/world.mass*dt;world.vz+=totalForce.z/world.mass*dt;
  world.x+=world.vx*dt;world.y+=world.vy*dt;world.z+=world.vz*dt;
  world.angularVelocity.addScaledVector(totalTorque,dt/world.inertia);
  const speed=world.angularVelocity.length();
  if(speed>1e-10)world.orientation.premultiply(new Quaternion().setFromAxisAngle(world.angularVelocity.clone().divideScalar(speed),speed*dt)).normalize();
  // Conservative box-plane contact against the worktop. The knife does not
  // acquire a new pose from a target; only contact resolves penetration.
  const q=world.orientation;
  const ey=Math.abs(new Vector3(1.4,0,0).applyQuaternion(q).y)+Math.abs(new Vector3(0,.16,0).applyQuaternion(q).y)+Math.abs(new Vector3(0,0,.12).applyQuaternion(q).y);
  if(world.y<.09+ey){world.y=.09+ey;world.vy=Math.max(0,-world.vy*.1);}
  for(const [p,velocity,min,max] of [['x','vx',-5.4,5.4],['z','vz',-3.1,1.25]]) {
    if(world[p]<min){world[p]=min;world[velocity]=Math.abs(world[velocity])*.1;}
    if(world[p]>max){world[p]=max;world[velocity]=-Math.abs(world[velocity])*.1;}
  }
  world.angle=2*Math.atan2(q.z,q.w);world.time+=dt;
}
export function knifeSettled(world,positionTolerance=.12,speedTolerance=.25) {
  const orientationError=1-Math.abs(world.orientation.dot(yawQuaternion(world.target.yaw)));
  return v(world).distanceTo(v(world.target))<positionTolerance&&Math.hypot(world.vx,world.vy,world.vz)<speedTolerance&&orientationError<.002&&world.angularVelocity.length()<.18;
}
function launch(fly,end,endOrientation,status,index) {
  const start=fly.position.clone(),distance=start.distanceTo(end);
  const lateral=(index%2?1:-1)*.4;
  fly.flight={start,end:end.clone(),fromQ:fly.orientation.clone(),toQ:endOrientation.clone(),
    c1:start.clone().add(new Vector3(lateral,.7,.85)),
    c2:end.clone().add(new Vector3(-lateral,.8,.65)),
    elapsed:0,duration:clamp(distance/3.8+.6,.8,2.8)};
  fly.status=status;fly.enabled=false;
}
export function dispatchCrew(world,crew) {
  const volunteers=new Set(crew);
  world.flies.forEach((fly,i)=>{
    fly.enabled=false;
    if(volunteers.has(i)) {
      const j=crew.indexOf(i);fly.attachment=-1.15+2.3*j/Math.max(1,crew.length-1);fly.gripZ=(j%2?.085:-.085);
      const destination=transformPoint(world,gripPoint(fly));
      // Retained volunteers adjust grips before the next lift too.
      if(fly.status==='attached'&&fly.position.distanceTo(destination)<.01)return;
      launch(fly,destination,world.orientation,'approach',i);
    } else if(fly.status==='attached'||fly.status==='approach') {
      launch(fly,v(PERCHES[i]),yawQuaternion(PERCHES[i].yaw),'returning',i);
    }
  });
}
export function stepFlyMotion(world,dt) {
  for(const fly of world.flies) {
    if(fly.status==='attached') {
      fly.position.copy(transformPoint(world,gripPoint(fly)));fly.orientation.copy(world.orientation);continue;
    }
    if(!fly.flight||dt===0)continue;
    const f=fly.flight;f.elapsed=Math.min(f.duration,f.elapsed+dt);
    const u=f.elapsed/f.duration,t=u*u*(3-2*u),s=1-t;
    const before=fly.position.clone();
    fly.position.copy(f.start).multiplyScalar(s**3).addScaledVector(f.c1,3*s*s*t).addScaledVector(f.c2,3*s*t*t).addScaledVector(f.end,t**3);
    const velocity=fly.position.clone().sub(before),yaw=Math.atan2(velocity.z,-velocity.x);
    const flightQ=yawQuaternion(yaw).multiply(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),clamp(-Math.atan2(velocity.y,Math.hypot(velocity.x,velocity.z)),-.45,.45)));
    fly.orientation.copy(f.fromQ).slerp(flightQ,Math.min(1,u*5)).slerp(f.toQ,clamp((u-.75)/.25,0,1));
    if(u>=1){fly.position.copy(f.end);fly.orientation.copy(f.toQ);fly.status=fly.status==='approach'?'attached':'perched';fly.flight=null;}
  }
}
export function crewAttached(world,crew) {return crew.length>=2&&crew.every(i=>world.flies[i].status==='attached');}
