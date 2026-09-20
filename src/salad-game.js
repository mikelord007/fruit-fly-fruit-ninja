import {createWorld,stepWorld,baselineForces,DT} from './physics.js';
import {recruit,FRUITS} from './fruit-memory.js';
export const RECIPES = [
  {name:'Sunshine bowl',subtitle:'The crowd pleaser',fruits:[0,1,2]},
  {name:'Berry besties',subtitle:'Double berry, extra happy',fruits:[2,0,2]},
  {name:'Green surprise',subtitle:'Teach your crew a new taste',fruits:[3,1,3]},
];
export const FRUIT_POSITION = {x:0,y:.56,radius:.43};
export function createGame(memory) {
  return {memory,world:createWorld({mass:.55,x:-2.5,y:.24,disabled:[0,1,2,3,4,5,6,7]}),phase:'idle',phaseTime:0,time:0,readyTime:0,crew:[],recipe:null,index:0,fruit:null,cutAt:null,cutCount:0,score:0,combo:0,served:0,events:[],rush:false,remaining:90,ended:false,lastQuality:'',pieces:[],orderId:0};
}
function emit(g,type,detail={}) { g.events.push({type,time:g.time,...detail}); }
function phase(g,value) {g.phase=value;g.phaseTime=0;}
function prepare(g) {
  g.fruit=g.recipe.fruits[g.index];g.cutAt=null;g.readyTime=0;
  g.crew=recruit(g.memory,g.fruit);
  g.world.flies.forEach((f,i)=>f.enabled=g.crew.includes(i));
  // The engineered motor system spreads volunteers across the knife's grip.
  g.crew.forEach((index,j)=>g.world.flies[index].attachment=-1.25+2.5*j/Math.max(1,g.crew.length-1));
  phase(g,g.crew.length>=2?'recruit':'waiting');
  emit(g,'recruit',{fruit:g.fruit,crew:[...g.crew]});
}
export function order(g,recipe) {
  if(!['idle','served'].includes(g.phase)||g.ended||!recipe?.fruits?.length||recipe.fruits.some(f=>!Number.isInteger(f)||!FRUITS[f])) return false;
  g.recipe={...recipe,fruits:[...recipe.fruits]};g.index=0;g.pieces=[];g.orderId++;prepare(g);return true;
}
export function refreshCrew(g) {if(g.phase==='waiting') prepare(g);}
export function timing(g) {return (Math.sin(g.readyTime*3.1-Math.PI/2)+1)/2;}
export function chop(g) {
  if(g.phase!=='ready') return false;
  const t=timing(g);g.lastQuality=t>.88?'PERFECT!':t>.6?'NICE CUT!':'CHOP!';
  g.pendingPoints=t>.88?150:t>.6?100:60;
  g.world.target={x:0,y:.16};phase(g,'cut');emit(g,'chop');return true;
}
// World-space blade edge, matching the rendered knife. Swept contact samples
// the interval at <= .025 units; an overhead pass or stationary overlap cannot cut.
export function bladeEdge(w) {
  const c=Math.cos(w.angle),s=Math.sin(w.angle);
  return [-.75,1.4].map(x=>({x:w.x+x*c+.16*s,y:w.y+x*s-.16*c}));
}
function distanceToSegment(p,a,b) {const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function bladeContact(before,after,fruit=FRUIT_POSITION,dt=DT) {
  if((after.y-before.y)/dt>-.25) return false;
  const travel=Math.hypot(after.x-before.x,after.y-before.y)+1.5*Math.abs(after.angle-before.angle);
  const samples=Math.max(1,Math.ceil(travel/.025));
  for(let i=0;i<=samples;i++) {const t=i/samples,w={x:before.x+(after.x-before.x)*t,y:before.y+(after.y-before.y)*t,angle:before.angle+(after.angle-before.angle)*t};const [a,b]=bladeEdge(w);if(distanceToSegment(fruit,a,b)<=fruit.radius) return true;}
  return false;
}
export function startRush(g) {if(!['idle','served','ended'].includes(g.phase)) return false;g.score=0;g.combo=0;g.served=0;g.rush=true;g.remaining=90;g.ended=false;g.pieces=[];g.fruit=null;phase(g,'idle');return true;}
export function stepGame(g,dt=DT) {
  if(g.ended) return;
  g.time+=dt;g.phaseTime+=dt;
  if(g.rush) {g.remaining=Math.max(0,g.remaining-dt);if(!g.remaining){g.ended=true;phase(g,'ended');emit(g,'ended');return;}}
  if(['idle','served','waiting'].includes(g.phase)) return;
  if(g.phase==='recruit') {if(g.phaseTime>1){g.world.target={x:0,y:1.85};phase(g,'lift');}else return;}
  const before={x:g.world.x,y:g.world.y,angle:g.world.angle};
  stepWorld(g.world,baselineForces(g.world),dt);
  if(g.phase==='lift'&&Math.abs(g.world.x)<.12&&Math.abs(g.world.y-1.85)<.12&&Math.hypot(g.world.vx,g.world.vy)<.25&&Math.abs(g.world.angle)<.12) {phase(g,'ready');emit(g,'ready');}
  else if(g.phase==='ready') g.readyTime+=dt;
  else if(g.phase==='cut') {
    if(g.cutAt===null&&bladeContact(before,g.world,FRUIT_POSITION,dt)) {
      g.cutAt=g.time;g.cutCount++;g.combo++;g.score+=g.pendingPoints+Math.min(5,g.combo-1)*10;
      g.pieces.push({fruit:g.fruit,at:g.time});emit(g,'slice',{quality:g.lastQuality});phase(g,'plate');g.world.target={x:0,y:1.5};
    } else if(g.phaseTime>4) {g.combo=0;g.world.target={x:0,y:1.85};phase(g,'lift');emit(g,'miss');}
  } else if(g.phase==='plate'&&g.phaseTime>2.0) {
    g.world.target={x:-2.5,y:.24};phase(g,'return');
  } else if(g.phase==='return'&&Math.abs(g.world.x+2.5)<.05&&Math.abs(g.world.y-.24)<.03&&Math.hypot(g.world.vx,g.world.vy)<.1) {
    g.index++;
    if(g.index>=g.recipe.fruits.length){g.served++;g.score+=200;phase(g,'served');g.crew=[];g.world.flies.forEach(f=>f.enabled=false);emit(g,'served');}
    else prepare(g);
  }
}
