// Game-specific associative plasticity on real KC→MBON edges. This is an
// engineered appetitive extension, NOT a model of the aversive PPL1 pathway.
export const FRUITS = Object.freeze([
  {id:'apple', name:'Apple', emoji:'🍎', color:'#ea6653', hex:0xe75542},
  {id:'orange', name:'Orange', emoji:'🍊', color:'#f6b34b', hex:0xf4a529},
  {id:'berry', name:'Strawberry', emoji:'🍓', color:'#cf5280', hex:0xcc3569},
  {id:'kiwi', name:'Kiwi', emoji:'🥝', color:'#8ab758', hex:0x81ad42},
]);
export const FLY_NAMES = ['Pip','Zest','Dot','Basil','Miso','Bean','Fig','Boba'];
export const VOLUNTEER_THRESHOLD = .72;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function createMemory(raw, {starter = true} = {}) {
  const ids = role => raw.neurons.filter(n=>n.role===role).map(n=>n.id).sort();
  const pnIds = ids('projection_neuron'), kcIds = ids('kenyon_cell');
  const pi = new Map(pnIds.map((id,i)=>[id,i])), ki = new Map(kcIds.map((id,i)=>[id,i]));
  const inputs = kcIds.map(()=>[]), aplInputs = kcIds.map(()=>0), aplOutputs = kcIds.map(()=>0), initial = kcIds.map(()=>0);
  for (const e of raw.edges) {
    if(e.relation==='pn_to_kc') inputs[ki.get(e.post)].push([pi.get(e.pre),e.count]);
    if(e.relation==='kc_to_mbon') initial[ki.get(e.pre)] += e.count;
    if(e.relation==='apl_to_kc') aplInputs[ki.get(e.post)] += e.count;
    if(e.relation==='kc_to_apl') aplOutputs[ki.get(e.pre)] += e.count;
  }
  if(initial.some(v=>!v)||inputs.some(v=>!v.length)) throw new Error('Incomplete mushroom body circuit');
  inputs.forEach(row=>{const sum=row.reduce((s,e)=>s+e[1],0); row.forEach(e=>e[1]/=sum);});
  const aplSum=aplOutputs.reduce((a,b)=>a+b,0), aplMax=Math.max(...aplInputs);
  const patterns = FRUITS.map((_,f)=> {const rng=random(12001+f*733); return pnIds.map(()=>rng()<.22 ? .65+.35*rng() : .02*rng());});
  const activity = patterns.map(pn=>{
    let apl=0, kc=[];
    for(let pass=0;pass<3;pass++) {
      const drive=inputs.map((row,i)=>Math.max(0,row.reduce((s,[p,w])=>s+pn[p]*w,0)-.3*apl*aplInputs[i]/aplMax));
      const winners=drive.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,15);
      kc=kcIds.map(()=>0); winners.forEach(([v,i])=>kc[i]=v/(winners[0][0]||1));
      apl=kc.reduce((s,v,i)=>s+v*aplOutputs[i]/aplSum,0);
    }
    return kc;
  });
  const memory = {kcIds, initial, activity, flies: FLY_NAMES.map(name=>({name,weights:initial.map(w=>w*.2),lessons:0})), history:[]};
  // Preferences are acquired through recorded training, not permanent fruit IDs.
  if(starter) [0,1,2,0,1,2,0,1].forEach((fruit,i)=>teach(memory,[i],fruit,6,'starter'));
  return memory;
}
export function responses(memory, index) {
  const w=memory.flies[index].weights;
  return memory.activity.map(kc=>kc.reduce((s,v,i)=>s+v*w[i],0)/kc.reduce((s,v,i)=>s+v*memory.initial[i],0));
}
export function recruit(memory,fruit) { return memory.flies.map((_,i)=>i).filter(i=>responses(memory,i)[fruit]>=VOLUNTEER_THRESHOLD); }
export function teach(memory, selected, fruit, repetitions=1, source='player') {
  if(!Number.isInteger(fruit)||!memory.activity[fruit]) throw new Error('Unknown fruit');
  const changes=[];
  for(const index of new Set(selected)) {
    const fly=memory.flies[index]; if(!fly) continue;
    for(let n=0;n<repetitions;n++) {
      memory.activity[fruit].forEach((eligibility,k)=>{
        if(!eligibility) return;
        const before=fly.weights[k], after=clamp(before+.28*eligibility*(1.5*memory.initial[k]-before),.05*memory.initial[k],1.5*memory.initial[k]);
        fly.weights[k]=after;
        if(Math.abs(after-before)>1e-8) changes.push({fly:index,kc:memory.kcIds[k],before,after});
      });
      fly.lessons++;
    }
  }
  memory.history.push({selected:[...selected],fruit,repetitions,source,changed:changes.length});
  return changes;
}
export function resetMemory(memory) { memory.flies.forEach(f=>{f.weights=memory.initial.map(w=>w*.2);f.lessons=0;}); memory.history=[]; }
export function changedSynapses(memory,index) { return memory.flies[index].weights.filter((w,k)=>Math.abs(w-.2*memory.initial[k])>1e-8).length; }
