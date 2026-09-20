import fs from 'node:fs';
import {createMemory,teach} from '../src/fruit-memory.js';
import {createGame,order,chop,timing,stepGame,RECIPES} from '../src/salad-game.js';
import {deserializeMotorSwarm,createMotorSwarm} from '../src/motor3d.js';
import {transformPoint,gripPoint} from '../src/flight3d.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url))),saved=JSON.parse(fs.readFileSync(new URL('../data/motor3d-policy.json',import.meta.url)));
function run(memory,recipe,motorMode='learned',seconds=60,motorSwarm=deserializeMotorSwarm(raw,saved)){
 const g=createGame(memory,{motorMode,motorSwarm});order(g,recipe);let maxGripError=0;
 for(let j=0;j<seconds*120&&g.phase!=='served';j++){stepGame(g);if(g.phase==='ready'&&timing(g)>.9)chop(g);for(const f of g.world.flies)if(f.status==='attached')maxGripError=Math.max(maxGripError,f.position.distanceTo(transformPoint(g.world,gripPoint(f))));}
 return {phase:g.phase,served:g.served,cuts:g.cutCount,time:g.time,maxGripError};
}
const m=createMemory(raw);teach(m,[0,4],3,6);const recipes=RECIPES.map(r=>({name:r.name,...run(m,r)})),pairs=[];
for(let a=0;a<8;a++)for(let b=a+1;b<8;b++){const memory=createMemory(raw,{starter:false});teach(memory,[a,b],3,6);pairs.push({crew:[a,b],...run(memory,{fruits:[3]},'learned',20)});}
const controls={untrained:run(createMemory(raw),RECIPES[0],'untrained',10),resetReadout:run(createMemory(raw),RECIPES[0],'learned',10,createMotorSwarm(raw))};
const result={description:'Learned XYZ controller in full gameplay; scripted perfect timing. Recipe preference training is independent.',recipes,pairs,controls,summary:{recipesPassed:recipes.filter(x=>x.served===1).length,pairsPassed:pairs.filter(x=>x.served===1).length,maxGripError:Math.max(...recipes.map(x=>x.maxGripError),...pairs.map(x=>x.maxGripError)),zeroControlsBlock:Object.values(controls).every(x=>x.cuts===0&&x.served===0)}};
fs.writeFileSync(new URL('../evidence/motor3d-gameplay.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(result.summary);if(result.summary.recipesPassed!==3||result.summary.pairsPassed!==28||!result.summary.zeroControlsBlock)process.exitCode=1;
