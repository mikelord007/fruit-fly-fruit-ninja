import {DT} from './physics.js';
import {KNIFE_HOME,createFlightWorld,dispatchCrew,stepFlyMotion,stepKnife,knifeSettled,crewAttached,poseQuaternion,transformPoint} from './flight3d.js';
import {recruit,FRUITS,stepNeuralActivity} from './fruit-memory.js';
import {motorActions,freeFlightAction} from './motor3d.js';
export const MOTOR_MODES=['autopilot','learned','untrained'];
export const RECIPES = [
  {name:'Sunshine bowl',subtitle:'The crowd pleaser',fruits:[0,1,2]},
  {name:'Berry besties',subtitle:'Double berry, extra happy',fruits:[2,0,2]},
  {name:'Green surprise',subtitle:'Teach your crew a new taste',fruits:[3,1,3]},
];
export const FRUIT_POSITION = {x:0,y:.56,z:0,radius:.43};
export function createGame(memory,{motorMode='autopilot',motorSwarm=null}={}) {
  if(!MOTOR_MODES.includes(motorMode))throw new RangeError('Unknown flight controller');
  return {memory,motorMode,motorSwarm,world:createFlightWorld(),phase:'idle',phaseTime:0,time:0,readyTime:0,crew:[],recipe:null,index:0,fruit:null,cutAt:null,cutCount:0,score:0,combo:0,served:0,events:[],rush:false,remaining:90,ended:false,lastQuality:'',pieces:[],orderId:0};
}
export function setMotorMode(g,mode,swarm=g.motorSwarm) {
  if(!MOTOR_MODES.includes(mode))throw new RangeError('Unknown flight controller');
  g.motorMode=mode;g.motorSwarm=swarm;
  // A previously ready knife must settle under its new controller before chopping.
  if(g.phase==='ready'){g.readyTime=0;phase(g,'lift');}
}
function emit(g,type,detail={}) { g.events.push({type,time:g.time,...detail}); }
function phase(g,value) {g.phase=value;g.phaseTime=0;}
function prepare(g) {
  g.fruit=g.recipe.fruits[g.index];g.cutAt=null;g.readyTime=0;
  g.crew=recruit(g.memory,g.fruit);
  dispatchCrew(g.world,g.crew.length>=2?g.crew:[]);
  phase(g,g.crew.length>=2?'recruit':'waiting');
  emit(g,'recruit',{fruit:g.fruit,crew:[...g.crew]});
}
export function order(g,recipe) {
  if(!['idle','served'].includes(g.phase)||g.ended||!recipe?.fruits?.length||recipe.fruits.some(f=>!Number.isInteger(f)||!FRUITS[f])) return false;
  g.recipe={...recipe,fruits:[...recipe.fruits]};g.index=0;g.pieces=[];g.orderId++;prepare(g);return true;
}
export function refreshCrew(g) {if(g.phase==='waiting') prepare(g);}
export function gust(g) {
  if(g.ended)return false;
  let affected=false;
  for(const f of g.world.flies)if(f.flight){f.flight.body.vx+=1.7;f.flight.body.vz+=1.2;f.flight.body.angularVelocity.z+=1.3;affected=true;}
  if(g.world.flies.some(f=>f.enabled)){
    g.world.vx+=1.1;g.world.vz+=.7;g.world.angularVelocity.z+=.8;affected=true;
    if(g.phase==='ready'){g.readyTime=0;phase(g,'lift');}
  }
  return affected;
}
export function timing(g) {return (Math.sin(g.readyTime*3.1-Math.PI/2)+1)/2;}
export function chop(g) {
  if(g.phase!=='ready') return false;
  const t=timing(g);g.lastQuality=t>.88?'PERFECT!':t>.6?'NICE CUT!':'CHOP!';
  g.pendingPoints=t>.88?150:t>.6?100:60;
  g.world.target={x:0,y:.18,z:0,yaw:0};phase(g,'cut');emit(g,'chop');return true;
}
// World-space blade edge, matching the rendered knife. Swept contact samples
// the interval at <= .025 units; an overhead pass or stationary overlap cannot cut.
export function bladeEdge(w) {
  return [-.75,1.4].map(x=>transformPoint(w,{x,y:-.16,z:0}));
}
function distanceToSegment(p,a,b) {const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy+((p.z??0)-a.z)*dz)/(dx*dx+dy*dy+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy,(p.z??0)-a.z-t*dz);}
export function bladeContact(before,after,fruit=FRUIT_POSITION,dt=DT) {
  if((after.y-before.y)/dt>-.25) return false;
  const qa=poseQuaternion(before),qb=poseQuaternion(after);
  const travel=Math.hypot(after.x-before.x,after.y-before.y,(after.z??0)-(before.z??0))+1.5*qa.angleTo(qb);
  const samples=Math.max(1,Math.ceil(travel/.025));
  for(let i=0;i<=samples;i++) {const t=i/samples,w={x:before.x+(after.x-before.x)*t,y:before.y+(after.y-before.y)*t,z:(before.z??0)+((after.z??0)-(before.z??0))*t,orientation:qa.clone().slerp(qb,t)};const [a,b]=bladeEdge(w);if(distanceToSegment(fruit,a,b)<=fruit.radius) return true;}
  return false;
}
export function startRush(g) {if(!['idle','served','ended'].includes(g.phase)) return false;g.score=0;g.combo=0;g.served=0;g.rush=true;g.remaining=90;g.ended=false;g.pieces=[];g.fruit=null;phase(g,'idle');return true;}
export function stepGame(g,dt=DT) {
  if(g.ended) return;
  g.time+=dt;g.phaseTime+=dt;
  stepFlyMotion(g.world,dt,(body,index)=>freeFlightAction(g.motorSwarm,body,index,g.motorMode));
  stepNeuralActivity(g.memory,['idle','served','ended','return'].includes(g.phase)?null:g.fruit,dt);
  if(g.rush) {g.remaining=Math.max(0,g.remaining-dt);if(!g.remaining){g.ended=true;phase(g,'ended');emit(g,'ended');return;}}
  if(['idle','served','waiting'].includes(g.phase)) return;
  if(g.phase==='recruit') {if(crewAttached(g.world,g.crew)){g.world.flies.forEach(f=>f.enabled=g.crew.includes(f.index));g.world.target={x:0,y:1.85,z:0,yaw:0};phase(g,'lift');}else return;}
  const before={x:g.world.x,y:g.world.y,z:g.world.z,orientation:g.world.orientation.clone()};
  g.world.banking=['lift','return'].includes(g.phase);
  const actions=g.motorMode==='autopilot'?undefined:motorActions(g.motorSwarm,g.world,g.motorMode);
  stepKnife(g.world,dt,actions);stepFlyMotion(g.world,0);
  if(g.phase==='lift'&&knifeSettled(g.world)) {phase(g,'ready');emit(g,'ready');}
  else if(g.phase==='ready') {
    if(!knifeSettled(g.world)){g.readyTime=0;phase(g,'lift');}
    else g.readyTime+=dt;
  }
  else if(g.phase==='cut') {
    if(g.cutAt===null&&bladeContact(before,g.world,FRUIT_POSITION,dt)) {
      g.cutAt=g.time;g.cutCount++;g.combo++;g.score+=g.pendingPoints+Math.min(5,g.combo-1)*10;
      g.pieces.push({fruit:g.fruit,at:g.time});emit(g,'slice',{quality:g.lastQuality});phase(g,'plate');g.world.target={x:0,y:1.5,z:0,yaw:0};
    } else if(g.phaseTime>4) {g.combo=0;g.world.target={x:0,y:1.85,z:0,yaw:0};phase(g,'lift');emit(g,'miss');}
  } else if(g.phase==='plate'&&g.phaseTime>2.0) {
    g.world.target={...KNIFE_HOME};phase(g,'return');
  } else if(g.phase==='return'&&knifeSettled(g.world,.035,.1)) {
    g.index++;
    if(g.index>=g.recipe.fruits.length){g.served++;g.score+=200;phase(g,'served');g.crew=[];dispatchCrew(g.world,[]);emit(g,'served');}
    else prepare(g);
  }
}
