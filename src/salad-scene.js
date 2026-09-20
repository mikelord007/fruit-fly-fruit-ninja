import * as THREE from '../vendor/three/three.module.js';
import {OrbitControls} from '../vendor/three/OrbitControls.js';
import {buildKitchenScene,pickRayFly} from './scene3d.js';
import {FRUITS,responses} from './fruit-memory.js';
const material=(color,extras={})=>new THREE.MeshStandardMaterial({color,roughness:.5,...extras});
function shape(geometry,color,x=0,y=0,z=0) {const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
function label(text,color='#234842') {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const c=canvas.getContext('2d');c.fillStyle=color;c.font='bold 58px system-ui';c.textAlign='center';c.fillText(text,256,85);
  const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.35,.3375,1);return sprite;
}
function fruitMesh(index,half=null) {
  const group=new THREE.Group(),f=FRUITS[index],r=.43;
  const skin=shape(new THREE.SphereGeometry(r,28,20,0,Math.PI*2,half==='bottom'?Math.PI/2:0,half?Math.PI/2:Math.PI),f.hex);
  if(index===2) skin.scale.set(.9,1.08,.9);
  if(index===3) skin.material.color.setHex(0x957047);
  group.add(skin);
  if(half) {const face=shape(new THREE.CircleGeometry(r,32),index===0?0xffecc4:index===1?0xffd379:index===2?0xffadbb:0xb8db64);face.rotation.x=half==='bottom'?-Math.PI/2:Math.PI/2;group.add(face);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const seed=shape(new THREE.SphereGeometry(.025,6,4),index===3?0x312a21:0xfff4cc,Math.cos(a)*.23,half==='bottom'?.004:-.004,Math.sin(a)*.23);seed.scale.y=.15;group.add(seed);}
  }
  if(half!=='bottom'&&index!==3) {const stem=shape(new THREE.CylinderGeometry(.027,.033,.16,8),0x67552e,0,.46,0);stem.rotation.z=-.2;group.add(stem);const leaf=shape(new THREE.SphereGeometry(.12,10,8),0x628443,.13,.48,0);leaf.scale.set(1.5,.24,.7);leaf.rotation.z=.3;group.add(leaf);}
  if(index===2)for(let i=0;i<18;i++){const a=i*2.4,y=half==='bottom'?-.08-(i%4)*.065:half==='top'?.08+(i%4)*.065:-.25+(i%7)*.075;const rr=Math.sqrt(Math.max(0,r*r-y*y));const seed=shape(new THREE.SphereGeometry(.022,6,4),0xffd885,Math.cos(a)*rr*.91,y,Math.sin(a)*rr*.91);group.add(seed);}
  return group;
}
export function createSaladView(canvas,{onSelect,onError}={}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const model=buildKitchenScene(),{scene,beamRig,flies,tethers,forceArrows,highlights}=model;
  scene.background=new THREE.Color(0xf8ead3);
  [...beamRig.children].forEach(child=>{if(!flies.includes(child)&&!tethers.includes(child))beamRig.remove(child);});
  flies.forEach(f=>scene.add(f));tethers.forEach(t=>t.visible=false);forceArrows.forEach(a=>a.visible=false);model.goal.visible=false;
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
  const swarmSign=label('THE TINY CHEFS');swarmSign.position.set(-3.1,3.7,-.7);swarmSign.scale.multiplyScalar(1.6);scene.add(swarmSign);
  const fruitGroups=FRUITS.map((_,i)=>{const f=fruitMesh(i);f.position.set(0,.56,0);scene.add(f);return f;});
  const parts=FRUITS.map((_,i)=>['top','bottom'].map(h=>{const p=fruitMesh(i,h);p.visible=false;scene.add(p);return p;}));
  const bowlBits=[];for(let i=0;i<12;i++){const bit=shape(new THREE.IcosahedronGeometry(.18,1),FRUITS[i%4].hex);bit.visible=false;scene.add(bit);bowlBits.push(bit);}
  const confetti=[];for(let i=0;i<34;i++){const bit=shape(new THREE.BoxGeometry(.055,.09,.035),[0xf2b648,0xe36b59,0x77a666,0xffeed0][i%4]);bit.visible=false;scene.add(bit);confetti.push(bit);}
  const badges=flies.map((_,i)=>{const badge=shape(new THREE.SphereGeometry(.061,10,8),0xffffff);scene.add(badge);const name=label(['Pip','Zest','Dot','Basil','Miso','Bean','Fig','Boba'][i]);name.scale.set(.48,.12,1);scene.add(name);return {badge,name};});
  const camera=new THREE.PerspectiveCamera(40,1,.1,60);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=16;controls.minPolarAngle=.65;controls.maxPolarAngle=1.5;controls.minAzimuthAngle=-.65;controls.maxAzimuthAngle=.65;
  function resetCamera(){camera.position.set(2.8,4.1,11.7);controls.target.set(.1,1.65,0);controls.update();}resetCamera();
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});
  canvas.addEventListener('click',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const i=pickRayFly(model,ray);if(i!==null)onSelect?.(i);});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onError?.('3D graphics paused. Reload to restore the kitchen.');});
  let lastTime=0,previousOrder=-1;
  function render(g,selected) {
    const width=canvas.clientWidth,height=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.floor(width*ratio)||canvas.height!==Math.floor(height*ratio)){renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=camera.aspect<1?62:40;camera.updateProjectionMatrix();}
    const t=g.time,dt=Math.min(.05,Math.max(.001,t-lastTime));lastTime=t;
    beamRig.position.set(g.world.x,g.world.y,0);beamRig.rotation.z=g.world.angle;
    const carrying=!['idle','served','waiting','ended'].includes(g.phase);
    flies.forEach((fly,i)=>{
      const active=carrying&&g.crew.includes(i),a=g.world.flies[i].attachment,c=Math.cos(g.world.angle),s=Math.sin(g.world.angle);
      tethers[i].visible=active;tethers[i].position.set(a,.08,0);
      const goal=active?new THREE.Vector3(g.world.x+a*c-.5*s,g.world.y+a*s+.5*c,(i%2-.5)*.14):new THREE.Vector3(-4.4+(i%4)*.73+Math.sin(t*1.7+i)*.10,2.35+Math.floor(i/4)*.68+Math.sin(t*2+i)*.1,.4+Math.sin(i*3)*.2);
      if(!fly.userData.placed){fly.position.copy(goal);fly.userData.placed=true;}else fly.position.lerp(goal,1-Math.exp(-dt*6));
      fly.rotation.z=active?g.world.angle:Math.sin(t+i)*.1;fly.scale.setScalar(active?1:1.3);
      fly.userData.wings.forEach((w,n)=>w.rotation.x=(n?1:-1)*(.55+Math.sin(t*65+i)*.6));
      highlights[i].visible=selected.has(i);
      const rs=responses(g.memory,i),best=rs.indexOf(Math.max(...rs));badges[i].badge.material.color.set(rs[best]>=.72?FRUITS[best].hex:0xc0b9a1);
      badges[i].badge.position.copy(fly.position).add(new THREE.Vector3(.14,.10,.12));badges[i].name.position.copy(fly.position).add(new THREE.Vector3(0,-.34,0));
    });
    fruitGroups.forEach((f,i)=>{f.visible=i===(g.fruit??0)&&g.cutAt===null&&g.phase!=='served'&&g.phase!=='ended';});
    parts.forEach(row=>row.forEach(p=>p.visible=false));
    if(g.cutAt!==null&&g.fruit!==null) {
      const age=t-g.cutAt,u=Math.min(1,age/1.45);
      parts[g.fruit].forEach((p,i)=>{p.visible=age<1.45;p.position.set(u*3.25+(i?-.15:.15)*Math.sin(u*Math.PI),.56+2.5*Math.sin(Math.PI*u)-u*.12,(i?-.15:.15)*Math.sin(u*Math.PI));p.rotation.set(u*5*(i?1:-1),0,u*2);p.scale.setScalar(1-u*.45);});
    }
    bowlBits.forEach((bit,i)=>{const piece=g.pieces[Math.floor(i/2)];bit.visible=!!piece&&t-piece.at>1.4;if(piece){bit.material.color.setHex(FRUITS[piece.fruit].hex);const a=i*2.4;bit.position.set(3.25+Math.cos(a)*.36,.32+Math.floor(i/4)*.17,Math.sin(a)*.36);bit.rotation.set(i,i*.7,0);}});
    confetti.forEach((bit,i)=>{const age=g.cutAt===null?10:t-g.cutAt;bit.visible=age<1.05;if(bit.visible){const a=i*2.4,speed=.8+(i%5)*.3;bit.position.set(Math.cos(a)*speed*age,.6+(2+i%3*.4)*age-3*age*age,Math.sin(a)*speed*age);bit.rotation.set(age*4,age*6,i);}});
    if(previousOrder!==g.orderId){previousOrder=g.orderId;}
    controls.update();renderer.render(scene,camera);
  }
  return {render,resetCamera,dispose(){controls.dispose();renderer.dispose();}};
}
