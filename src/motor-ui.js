import {createMotorSwarm,serializeMotorSwarm,deserializeMotorSwarm} from './motor3d.js';
const $=id=>document.getElementById(id);
const KEY='fruit-fly-motor3d-v1';
const COPY={autopilot:'Reference controller steers each fly and the knife.',learned:'Learned steering from shelf to knife, and back.',untrained:'No thrust: flies cannot navigate or lift the knife.'};
export async function createMotorUI(circuit,memory,{onChange,onRestart}) {
  const state={mode:'learned',swarm:createMotorSwarm(circuit)};
  let shipped=null,worker=null;
  const status=message=>$('motorTrainingStatus').textContent=message;
  try{
    const response=await fetch('./data/motor3d-policy.json');
    if(!response.ok)throw new Error('No shipped flight policy');
    shipped=await response.json();state.swarm=deserializeMotorSwarm(circuit,shipped);
    status('A trained 3D flight lesson is ready. Learned action readout is steering.');
  }catch{status('No saved flight lesson is available. Train a new readout here.');}
  try{
    const saved=localStorage.getItem(KEY);
    if(saved){state.swarm=deserializeMotorSwarm(circuit,JSON.parse(saved));status(state.swarm.trained?'Your saved flight lesson is loaded.':'Your erased flight weights are still zero. Train or restore a lesson.');}
  }catch{status('Saved flight data could not be read. Using the available starter lesson.');}
  $('restoreMotor').disabled=!shipped;
  const pnMap=new Map(state.swarm.topo.pn.map((id,i)=>[String(id),i])),kcMap=new Map(state.swarm.topo.kc.map((id,i)=>[String(id),i]));
  const pnOrder=memory.pnIds.map(id=>pnMap.get(String(id))),kcOrder=memory.kcIds.map(id=>kcMap.get(String(id)));
  const resting={pn:memory.pnIds.map(()=>0),kc:memory.kcIds.map(()=>0)};
  function save(){try{localStorage.setItem(KEY,JSON.stringify(serializeMotorSwarm(state.swarm)));}catch{status($('motorTrainingStatus').textContent+' This browser could not save the lesson.');}}
  function change(){
    $('motorMode').value=state.mode;
    $('motorHint').textContent=COPY[state.mode];
    onChange(state.mode,state.swarm);
  }
  function busy(active){
    for(const id of ['trainMotor','resetMotor','restoreMotor'])$(id).disabled=active||(id==='restoreMotor'&&!shipped);
    $('motorProgress').hidden=!active;
  }
  $('motorMode').onchange=()=>{state.mode=$('motorMode').value;$('brainSource').value=state.mode==='autopilot'?'taste':'motor';change();};
  $('restartMotorRound').onclick=onRestart;
  $('resetMotor').onclick=()=>{
    state.swarm=createMotorSwarm(circuit);state.mode='learned';
    $('brainSource').value='motor';status('Flight output weights erased. The learned controller now produces zero thrust. Train again to recover.');save();change();
  };
  $('restoreMotor').onclick=()=>{
    state.swarm=deserializeMotorSwarm(circuit,shipped);state.mode='learned';
    $('brainSource').value='motor';status('Starter flight lesson restored. Fruit preferences are unchanged.');save();change();
  };
  $('trainMotor').onclick=()=>{
    if(worker)return;
    busy(true);$('motorProgress').value=0;status('Learning XYZ forces and rotation from the autopilot teacher…');
    const finish=()=>{worker?.terminate();worker=null;busy(false);};
    try{
      worker=new Worker(new URL('./motor3d-worker.js',import.meta.url),{type:'module'});
      worker.onmessage=({data})=>{
        if(data.type==='progress'){$('motorProgress').value=data.progress;status(data.message);}
        else if(data.type==='complete'){
          try{
            state.swarm=deserializeMotorSwarm(circuit,data.saved);state.mode='learned';$('brainSource').value='motor';
            status(`Flight lesson learned from ${state.swarm.training.samples.toLocaleString()} simulated states. Six outputs fitted and copied to all eight chefs.`);save();change();
          }catch(error){status(`Flight lesson could not be loaded: ${error.message}`);}finally{finish();}
        }else if(data.type==='error'){status(`Flight training failed: ${data.message}`);finish();}
      };
      worker.onerror=()=>{status('Flight training could not finish. Your previous flight lesson is intact.');finish();};
      worker.postMessage({type:'train',circuit});
    }catch{status('This browser could not start flight training. You can still restore the starter lesson.');finish();}
  };
  function live(index,game){
    const fly=game.world.flies[index];
    if(state.mode==='autopilot'||(!fly.enabled&&!fly.flight)||game.ended)return resting;
    const a=state.swarm.agents[index];
    return {pn:pnOrder.map(i=>Math.min(1,Math.abs(a.lastPNActivity[i])*15)),kc:kcOrder.map(i=>Math.min(1,Math.abs(a.lastActivity[i])*15))};
  }
  function update(game,index){
    const fly=game.world.flies[index],agent=state.swarm.agents[index];
    const zero=state.mode==='untrained'||agent.readout.every(row=>row.every(w=>w===0));
    $('motorHint').textContent=state.mode==='learned'&&zero?'Flight weights are zero. Train or restore a flight lesson.':COPY[state.mode];
    if($('motorReadout').parentElement.parentElement.open){
      const force=fly.enabled||fly.flight?Math.hypot(fly.fx,fly.fy,fly.fz):0,torque=fly.enabled||fly.flight?fly.torque.length():0;
      const changed=state.mode==='untrained'?0:agent.readout.reduce((sum,row)=>sum+row.filter(w=>Math.abs(w)>1e-7).length,0);
      $('motorReadout').textContent=`${memory.flies[index].name} · force ${force.toFixed(2)} / 8 · torque ${torque.toFixed(2)} / 0.9 · ${changed} flight weights${state.mode==='autopilot'?' (readout idle)':''}`;
    }
  }
  // Do not accept a selection while the asynchronous policy load is still
  // installing handlers; the displayed mode must match the active controller.
  $('motorMode').value=state.mode;
  $('motorMode').disabled=false;
  $('restartMotorRound').disabled=false;
  busy(false);
  return {state,live,update};
}
