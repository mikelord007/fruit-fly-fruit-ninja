import fs from 'node:fs';
import {trainMotorSwarm,serializeMotorSwarm} from '../src/motor3d.js';
const circuit=JSON.parse(fs.readFileSync(new URL('../data/circuit.json',import.meta.url)));
const swarm=trainMotorSwarm(circuit,{},p=>console.log(p.message));
fs.writeFileSync(new URL('../data/motor3d-policy.json',import.meta.url),JSON.stringify(serializeMotorSwarm(swarm))+'\n');
console.log(swarm.training);
