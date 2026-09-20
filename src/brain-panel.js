// Rotatable 3D schematic, projected into a lightweight canvas. Node identity and
// edges are anatomical; coordinates are intentionally illustrative.
export function createBrainPanel(canvas,memory) {
  const ctx=canvas.getContext('2d'),pnIndex=new Map(memory.pnIds.map((id,i)=>[id,i])),kcIndex=new Map(memory.kcIds.map((id,i)=>[id,i]));
  const nodes=memory.neurons.map((neuron,i)=>{
    const pn=pnIndex.has(neuron.id),kc=kcIndex.has(neuron.id),n=pn?pnIndex.get(neuron.id):kc?kcIndex.get(neuron.id):i;
    const count=pn?124:192,y=1-2*(n+.5)/count,a=n*2.3999632297,r=Math.sqrt(Math.max(0,1-y*y));
    let point=pn?{x:-.9+Math.cos(a)*r*.65,y:.17+y*.72,z:Math.sin(a)*r*.56}:{x:.35+Math.cos(a)*r*.87,y:.26+y*.78,z:Math.sin(a)*r*.65};
    // Read by topology for non-sensory cells: role strings differ across extracts.
    const isOutput=memory.edges.some(e=>e.relation==='kc_to_mbon'&&e.post===neuron.id);
    const isApl=memory.edges.some(e=>e.relation==='kc_to_apl'&&e.post===neuron.id);
    const kind=pn?'pn':kc?'kc':isOutput?'mbon':isApl?'apl':'ppl1';
    if(!pn&&!kc)point=kind==='mbon'?{x:1.12,y:-.86,z:.15}:kind==='apl'?{x:.0,y:-.68,z:-.25}:{x:-1.24,y:-.84,z:0};
    return {id:neuron.id,...point,kind,index:n};
  });
  const byId=new Map(nodes.map((n,i)=>[n.id,i])),edges=memory.edges.map(e=>({...e,a:byId.get(e.pre),b:byId.get(e.post)}));
  let yaw=-.28,pitch=.12,zoom=1,drag=null;
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.009;pitch=Math.max(-1.2,Math.min(1.2,pitch+(e.clientY-drag.y)*.009));drag={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','r','R'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch-=.12;if(e.key==='ArrowDown')pitch+=.12;if(e.key.toLowerCase()==='r'){yaw=-.28;pitch=.12;zoom=1;}}});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.75,Math.min(1.5,zoom-e.deltaY*.001));},{passive:false});
  function render(index,time) {
    const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const live=memory.flies[index].live;
    const rates=nodes.map(n=>n.kind==='pn'?live.pn[n.index]:n.kind==='kc'?live.kc[n.index]:n.kind==='mbon'?Math.min(1,live.mbon/1.5):n.kind==='apl'?Math.min(1,live.apl*8):0);
    const scale=Math.min(width/3.3,height/2.2)*zoom;
    const projected=nodes.map(n=>{
      const x=n.x*Math.cos(yaw)+n.z*Math.sin(yaw),z=-n.x*Math.sin(yaw)+n.z*Math.cos(yaw),y=n.y*Math.cos(pitch)-z*Math.sin(pitch),depth=n.y*Math.sin(pitch)+z*Math.cos(pitch),p=4/(4+depth);
      return {x:width/2+x*scale*p,y:height*.46-y*scale*p,z:depth,p};
    });
    ctx.strokeStyle='rgba(186,215,167,.065)';ctx.lineWidth=.55;ctx.beginPath();
    edges.forEach((e,i)=>{if(i%9!==0||e.relation==='ppl1_to_kc')return;const a=projected[e.a],b=projected[e.b];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);});ctx.stroke();
    edges.forEach((e,i)=>{
      if(e.relation==='ppl1_to_kc'||rates[e.a]<.12||rates[e.b]<.08)return;
      if(e.relation!=='kc_to_mbon'&&i%5!==0)return;
      const a=projected[e.a],b=projected[e.b],strength=e.relation==='kc_to_mbon'?memory.flies[index].weights[kcIndex.get(e.pre)]/memory.initial[kcIndex.get(e.pre)]:1;
      ctx.strokeStyle=e.relation==='kc_to_mbon'?`rgba(245,211,142,${.12+rates[e.a]*.30})`:`rgba(156,204,138,${.07+rates[e.a]*.12})`;
      ctx.lineWidth=.4+strength*.45;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      if(i%3===0||e.relation==='kc_to_mbon'){const t=(time*.58+i*.117)%1;ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,1,0,Math.PI*2);ctx.fillStyle='rgba(251,231,166,.65)';ctx.fill();}
    });
    nodes.map((n,i)=>({n,i,p:projected[i]})).sort((a,b)=>b.p.z-a.p.z).forEach(({n,i,p})=>{
      const rate=rates[i],glow=rate*(.72+.28*Math.sin(time*(3+rate*2)+i*1.7)**2),color=n.kind==='pn'?'240,180,110':n.kind==='mbon'?'255,231,159':n.kind==='apl'?'204,139,94':'174,215,147';
      if(glow>.08){const size=(n.kind==='mbon'?10:5)*p.p;const gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,size);gradient.addColorStop(0,`rgba(${color},${glow*.55})`);gradient.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=gradient;ctx.fillRect(p.x-size,p.y-size,size*2,size*2);}
      ctx.fillStyle=rate>.04?`rgba(${color},${.4+glow*.6})`:'rgba(143,169,147,.34)';ctx.beginPath();ctx.arc(p.x,p.y,(n.kind==='mbon'||n.kind==='apl'?2.5:.95+glow*.8)*p.p,0,Math.PI*2);ctx.fill();
    });
    ctx.font='8px system-ui';ctx.fillStyle='#9fbaa8';ctx.textAlign='left';ctx.fillText('PN → KC → MBON',9,height-9);ctx.textAlign='right';ctx.fillText('drag to rotate',width-9,height-9);
  }
  return {render};
}
