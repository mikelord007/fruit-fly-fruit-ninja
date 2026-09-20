// Keep gameplay mounted while expanding; use a viewport overlay when native
// fullscreen is unavailable (for example, in an embedded or mobile browser).
export function setupFullscreen(panel, toggle, menu, status) {
  let expanded=false, fallback=false, busy=false;
  let outside=[];
  function show(active) {
    if(expanded===active)return;
    expanded=active;
    panel.classList.toggle('is-expanded',active);
    document.body.classList.toggle('kitchen-expanded',active);
    toggle.textContent=active?'Exit fullscreen ⤡':'Fullscreen ⤢';
    toggle.setAttribute('aria-pressed',String(active));
    toggle.title=active?'Exit fullscreen (Esc)':'Expand the kitchen';
    menu.hidden=!active;
    if(active){
      // Prevent keyboard focus from escaping behind the viewport fallback.
      for(let node=panel;node.parentElement;node=node.parentElement){
        for(const sibling of node.parentElement.children){
          if(sibling!==node){outside.push([sibling,sibling.inert]);sibling.inert=true;}
        }
      }
      panel.querySelector('canvas').focus({preventScroll:true});
    }else{
      for(const [node,wasInert] of outside)node.inert=wasInert;
      outside=[];
      toggle.focus({preventScroll:true});
    }
    status.textContent=active?'Kitchen expanded. Press Escape or Exit fullscreen to return.':'Kitchen returned to page view.';
  }
  async function exit() {
    if(fallback){fallback=false;show(false);return true;}
    if(document.fullscreenElement===panel){
      try{await document.exitFullscreen();}catch{
        status.textContent='Use your browser’s fullscreen control or Escape to return.';
        return false;
      }
    }
    show(false);
    return true;
  }
  toggle.addEventListener('click',async()=>{
    if(busy)return;
    busy=true;
    try{
      if(expanded){await exit();return;}
      if(panel.requestFullscreen&&document.fullscreenEnabled){
        try{await panel.requestFullscreen();show(document.fullscreenElement===panel);return;}catch{/* Use the viewport fallback. */}
      }
      fallback=true;show(true);
    }finally{busy=false;}
  });
  document.addEventListener('fullscreenchange',()=>{
    if(!fallback)show(document.fullscreenElement===panel);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&expanded){event.preventDefault();void exit();}
  });
  menu.addEventListener('click',async()=>{
    if(!await exit())return;
    document.querySelector('#orders').scrollIntoView({block:'start'});
    document.querySelector('#recipes button:not(:disabled), #trainingFruit')?.focus();
  });
}
