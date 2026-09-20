import {trainMotorSwarm,serializeMotorSwarm} from './motor3d.js';
self.onmessage=({data})=>{
  if(data.type!=='train')return;
  try {const swarm=trainMotorSwarm(data.circuit,data.options,p=>self.postMessage({type:'progress',progress:p.fraction,message:p.message}));self.postMessage({type:'complete',saved:serializeMotorSwarm(swarm)});}
  catch(error){self.postMessage({type:'error',message:error.message});}
};
