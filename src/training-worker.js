import { trainSwarm, serializeSwarm } from './neural.js';
self.onmessage=async()=>{try{const circuit=await fetch('../data/circuit.json').then(r=>r.json());const swarm=trainSwarm(circuit,{},progress=>self.postMessage({progress}));self.postMessage({saved:serializeSwarm(swarm)})}catch(error){self.postMessage({error:String(error?.message||error)})}};
