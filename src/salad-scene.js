import * as THREE from '../vendor/three/three.module.js';
import {OrbitControls} from '../vendor/three/OrbitControls.js';
import {buildKitchenScene,pickRayFly} from './scene3d.js';
import {FRUITS,responses} from './fruit-memory.js';
import {createFruitModel as fruitMesh} from './fruit-models.js';
import {PERCHES,KNIFE_HOME,gripPoint} from './flight3d.js';
const material=(color,extras={})=>new THREE.MeshStandardMaterial({color,roughness:.5,...extras});
function shape(geometry,color,x=0,y=0,z=0) {const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
function label(text,color='#234842') {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const c=canvas.getContext('2d');c.fillStyle=color;c.font='bold 58px system-ui';c.textAlign='center';c.fillText(text,256,85);
  const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.35,.3375,1);return sprite;
}
export function syncFlyTransforms(beamRig,scene,flies,world) {
  beamRig.position.set(world.x,world.y,world.z);beamRig.quaternion.copy(world.orientation);
  flies.forEach((fly,i)=>{
    const state=world.flies[i];
    if(state.status==='attached') {
      if(fly.parent!==beamRig)beamRig.add(fly);
      const local=gripPoint(state);fly.position.set(local.x,local.y,local.z);fly.quaternion.identity();
    }else{
      if(fly.parent!==scene)scene.add(fly);
      fly.position.copy(state.position);fly.quaternion.copy(state.orientation);
    }
  });
}
export function createSaladView(canvas,{onSelect,onError}={}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const model=buildKitchenScene(),{scene,beamRig,flies,tethers,forceArrows,highlights}=model;
  scene.background=new THREE.Color(0xf8ead3);
  [...beamRig.children].forEach(child=>{if(!flies.includes(child)&&!tethers.includes(child))beamRig.remove(child);});
  flies.forEach(f=>scene.add(f));tethers.forEach(t=>t.visible=false);forceArrows.forEach(a=>a.visible=false);model.goal.visible=false;
  for(const [i,tether] of tethers.entries()) {
    tether.geometry.dispose();tether.geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
    tether.material.opacity=.75;tether.name=`Chef ${i+1} grip`;
  }
  // Distinct, tangible resting places across the room's depth.
  for(const [x,y,z,width] of [[-3.55,2.1,-1.8,1.7],[4.5,2.46,-1.2,1.45],[-4.45,3.35,-2.92,1.5]]) {
    const shelf=shape(new THREE.BoxGeometry(width,.12,.65),0xaa794e,x,y,z);scene.add(shelf);
    for(const offset of [-width*.32,width*.32])scene.add(shape(new THREE.BoxGeometry(.06,.3,.1),0x466e58,x+offset,y-.15,z-.19));
  }
  const rest=shape(new THREE.BoxGeometry(3,.32,.55),0xb3895c,KNIFE_HOME.x,0,KNIFE_HOME.z);rest.rotation.y=KNIFE_HOME.yaw;scene.add(rest);
  PERCHES.forEach((perch,i)=>{
    const plaque=label(`${i+1} · ${['Pip','Zest','Dot','Basil','Miso','Bean','Fig','Boba'][i]}`);
    plaque.position.set(perch.x,perch.y-.36,perch.z+.12);plaque.scale.set(.53,.1325,1);scene.add(plaque);
  });
  const blade=shape(new THREE.BoxGeometry(2.15,.28,.08),0xe8efef,.325,-.02,0);blade.material.metalness=.38;blade.material.roughness=.23;beamRig.add(blade);
  const edge=shape(new THREE.BoxGeometry(2.15,.022,.026),0xffffff,.325,-.16,0);edge.material.metalness=.9;beamRig.add(edge);
  const handle=shape(new THREE.CapsuleGeometry(.105,.5,6,14),0x305a50,-1.055,.01,0);handle.rotation.z=Math.PI/2;beamRig.add(handle);
  [-1.22,-.94].forEach(x=>beamRig.add(shape(new THREE.SphereGeometry(.029,8,6),0xd5b76f,x,.01,.103)));
  const board=shape(new THREE.BoxGeometry(3.7,.13,1.45),0xc69460,0,.025,0);scene.add(board);
  for(let i=0;i<9;i++){scene.add(shape(new THREE.BoxGeometry(.014,.002,1.3),0xab7e4e,-1.65+i*.4,.093,0));}
  const bowl=new THREE.Group();bowl.position.set(3.25,.65,.0);scene.add(bowl);
  const shell=shape(new THREE.SphereGeometry(.85,36,20,0,Math.PI*2,Math.PI/2,Math.PI/2),0xfaf8e9);shell.material.side=THREE.DoubleSide;bowl.add(shell);
  const rim=shape(new THREE.TorusGeometry(.85,.065,10,48),0x427f72);rim.rotation.x=Math.PI/2;bowl.add(rim);
  const base=shape(new THREE.CylinderGeometry(.37,.39,.1,24),0x427f72,0,-.64,0);bowl.add(base);
  const ticket=label('SALAD BAR');ticket.position.set(3.3,1.8,-1.8);scene.add(ticket);
  const fruitGroups=FRUITS.map((_,i)=>{const f=fruitMesh(i);f.position.set(0,.56,0);scene.add(f);return f;});
  const parts=FRUITS.map((_,i)=>['top','bottom'].map(h=>{const p=fruitMesh(i,h);p.visible=false;scene.add(p);return p;}));
  const bowlBits=[];for(let i=0;i<12;i++){const bit=shape(new THREE.IcosahedronGeometry(.18,1),FRUITS[i%4].hex);bit.visible=false;scene.add(bit);bowlBits.push(bit);}
  const confetti=[];for(let i=0;i<34;i++){const bit=shape(new THREE.BoxGeometry(.055,.09,.035),[0xf2b648,0xe36b59,0x77a666,0xffeed0][i%4]);bit.visible=false;scene.add(bit);confetti.push(bit);}
  const badges=flies.map((_,i)=>{const badge=shape(new THREE.SphereGeometry(.055,10,8),0xffffff);flies[i].add(badge);badge.position.set(.14,.1,.12);return {badge};});
  const trails=flies.map(()=>{
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(36*3),3));geometry.setDrawRange(0,0);
    const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x6c9578,transparent:true,opacity:.38}));line.frustumCulled=false;scene.add(line);
    return {line,points:[],last:-1};
  });
  let previousWorld=null;
  const camera=new THREE.PerspectiveCamera(40,1,.1,60);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=19;controls.minPolarAngle=.45;controls.maxPolarAngle=1.54;controls.minAzimuthAngle=-1.05;controls.maxAzimuthAngle=1.05;
  function resetCamera(){camera.position.set(5.8,5.1,12.5);controls.target.set(0,2.45,-1);controls.update();}resetCamera();
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});
  canvas.addEventListener('click',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const i=pickRayFly(model,ray);if(i!==null)onSelect?.(i);});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onError?.('3D graphics paused. Reload to restore the kitchen.');});
  function render(g,selected,inspected=0) {
    const width=canvas.clientWidth,height=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.floor(width*ratio)||canvas.height!==Math.floor(height*ratio)){renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=Math.min(67,2*Math.atan(Math.tan(THREE.MathUtils.degToRad(40/2))*Math.max(1,1.45/camera.aspect))*180/Math.PI);camera.updateProjectionMatrix();}
    const t=g.time;
    if(previousWorld!==g.world){for(const trail of trails){trail.points=[];trail.last=-1;}previousWorld=g.world;}
    syncFlyTransforms(beamRig,scene,flies,g.world);
    flies.forEach((fly,i)=>{
      const state=g.world.flies[i],active=state.status==='attached',local=gripPoint(state);
      tethers[i].visible=active;tethers[i].position.set(0,0,0);
      if(active){
        // One parent transform for both knife and carrier: no trailing lerp.
        const positions=tethers[i].geometry.attributes.position;
        positions.setXYZ(0,local.x,.12,0);positions.setXYZ(1,local.x,.16,local.z);positions.needsUpdate=true;
      }
      fly.scale.setScalar(1.12);
      fly.userData.wings.forEach((w,n)=>w.rotation.x=(n?1:-1)*(.55+(state.status==='perched'?0:Math.sin(t*65+i)*.6)));
      const trail=trails[i];
      const tracing=!!state.flight||active;
      if(tracing&&t-trail.last>.03){trail.points.push(state.position.clone());if(trail.points.length>36)trail.points.shift();trail.last=t;}
      if(!tracing)trail.points=[];
      const positions=trail.line.geometry.attributes.position;
      trail.points.forEach((p,j)=>positions.setXYZ(j,p.x,p.y,p.z));positions.needsUpdate=true;
      trail.line.geometry.setDrawRange(0,trail.points.length);trail.line.visible=trail.points.length>1;
      const force=new THREE.Vector3(state.fx,state.fy,state.fz),magnitude=force.length(),arrow=forceArrows[i];
      arrow.visible=i===inspected&&(state.enabled||state.flight)&&magnitude>.05;
      if(arrow.visible){arrow.position.copy(state.position);arrow.setDirection(force.normalize());arrow.setLength(Math.min(.85,.18+magnitude*.15),.12,.065);}
      highlights[i].visible=i===inspected;
      const rs=responses(g.memory,i),best=rs.indexOf(Math.max(...rs));badges[i].badge.material.color.set(rs[best]>=.72?FRUITS[best].hex:0xc0b9a1);
    });
    fruitGroups.forEach((f,i)=>{f.visible=i===(g.fruit??0)&&g.cutAt===null&&g.phase!=='served'&&g.phase!=='ended';});
    parts.forEach(row=>row.forEach(p=>p.visible=false));
    if(g.cutAt!==null&&g.fruit!==null) {
      const age=t-g.cutAt,u=Math.min(1,age/1.45);
      parts[g.fruit].forEach((p,i)=>{p.visible=age<1.45;p.position.set(u*3.25+(i?-.15:.15)*Math.sin(u*Math.PI),.56+2.5*Math.sin(Math.PI*u)-u*.12,(i?-.15:.15)*Math.sin(u*Math.PI));p.rotation.set(u*5*(i?1:-1),0,u*2);p.scale.setScalar(1-u*.45);});
    }
    bowlBits.forEach((bit,i)=>{const piece=g.pieces[Math.floor(i/2)];bit.visible=!!piece&&t-piece.at>1.4;if(piece){bit.material.color.setHex(FRUITS[piece.fruit].hex);const a=i*2.4;bit.position.set(3.25+Math.cos(a)*.36,.32+Math.floor(i/4)*.17,Math.sin(a)*.36);bit.rotation.set(i,i*.7,0);}});
    confetti.forEach((bit,i)=>{const age=g.cutAt===null?10:t-g.cutAt;bit.visible=age<1.05;if(bit.visible){const a=i*2.4,speed=.8+(i%5)*.3;bit.position.set(Math.cos(a)*speed*age,.6+(2+i%3*.4)*age-3*age*age,Math.sin(a)*speed*age);bit.rotation.set(age*4,age*6,i);}});
    controls.update();renderer.render(scene,camera);
  }
  return {render,resetCamera,dispose(){for(const {line} of trails){line.geometry.dispose();line.material.dispose();}controls.dispose();renderer.dispose();}};
}
