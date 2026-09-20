import {readFile,writeFile} from 'node:fs/promises';
import {createMemory,teach,resetMemory,recruit,responses} from '../src/fruit-memory.js';
import {createGame,order,chop,timing,stepGame,RECIPES} from '../src/salad-game.js';
const raw=JSON.parse(await readFile(new URL('../data/circuit.json',import.meta.url)));
function run(memory,recipe,seconds=60) {
  const g=createGame(memory);order(g,recipe);
  for(let i=0;i<seconds*120&&g.phase!=='served';i++){stepGame(g);if(g.phase==='ready'&&timing(g)>.9)chop(g);}
  return {phase:g.phase,seconds:g.time,cuts:g.cutCount,score:g.score,served:g.served,contacts:g.events.filter(e=>e.type==='slice'),recruitments:g.events.filter(e=>e.type==='recruit')};
}
const m=createMemory(raw),starterResponses=m.flies.map((f,i)=>({name:f.name,responses:responses(m,i)}));
const kiwiBefore=recruit(m,3);teach(m,[0,4],3,6);const kiwiAfter=recruit(m,3);
const recipes=RECIPES.map(r=>({name:r.name,...run(m,r)}));
const pairs=[];
for(let a=0;a<8;a++)for(let b=a+1;b<8;b++){const memory=createMemory(raw,{starter:false});teach(memory,[a,b],3,6);pairs.push({crew:[a,b],...run(memory,{fruits:[3]},15)});}
resetMemory(m);const reset=run(m,RECIPES[0],5);teach(m,[0,4],0,6);const recovery=run(m,{fruits:[0]},15);
const result={schema:1,description:'Deterministic software simulation; no biological validation. Perfect timing input is supplied programmatically.',starterResponses,kiwiBefore,kiwiAfter,recipes,pairs,reset,recovery,summary:{recipesPassed:recipes.filter(r=>r.served===1).length,recipesTotal:recipes.length,pairsPassed:pairs.filter(r=>r.served===1).length,pairsTotal:pairs.length,resetBlocks:reset.phase==='waiting'&&reset.cuts===0,retrainingRecovers:recovery.served===1}};
await writeFile(new URL('../evidence/salad-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary,null,2));
if(result.summary.recipesPassed!==3||result.summary.pairsPassed!==28||!result.summary.resetBlocks||!result.summary.retrainingRecovers)process.exitCode=1;
