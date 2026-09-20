import {createMemory,FRUITS,FLY_NAMES,responses,recruit,teach,resetMemory,changedSynapses,VOLUNTEER_THRESHOLD,sniff} from './fruit-memory.js';
import {createGame,order,stepGame,chop,timing,startRush,refreshCrew,RECIPES,setMotorMode} from './salad-game.js';
import {createSaladView} from './salad-scene.js';
import {DT} from './physics.js';
import {PERCHES} from './flight3d.js';
import {createBrainPanel} from './brain-panel.js';
import {createMotorUI} from './motor-ui.js';
import {setupFullscreen} from './fullscreen.js';
const $=id=>document.getElementById(id);
setupFullscreen($('kitchen'),$('fullscreen'),$('kitchenMenu'),$('fullscreenStatus'));
const text=(id,value)=>{if($(id).textContent!==String(value))$(id).textContent=String(value);};
let memory,game,view,brainPanel,motorUI,selected=new Set([0,4]),inspect=0,custom=new Set([0,1,2]),sound=false,audioContext=null,paused=false;
let accumulator=0,last=performance.now(),uiTick=0,lastPhase='',lastOrder=-1;
const newGame=()=>createGame(memory,motorUI?{motorMode:motorUI.state.mode,motorSwarm:motorUI.state.swarm}:{});
const idle=()=>['idle','served'].includes(game.phase)&&!game.ended;
function beep(kind) {
  if(!sound) return;
  try {audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const notes=kind==='slice'?[660,990,1320]:kind==='served'?[523,659,784,1047]:kind==='teach'?[440,554,659]:[330];notes.forEach((frequency,i)=>{const o=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+i*.065;o.type='sine';o.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.06,t+.01);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(gain);gain.connect(audioContext.destination);o.start(t);o.stop(t+.2);});}catch{sound=false;}
}
function feedback(message) {const el=$('floatFeedback');el.textContent=message;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1450);}
function memoryUI() {
  memory.flies.forEach((fly,i)=>{const tastes=responses(memory,i),fans=tastes.map((v,j)=>v>=VOLUNTEER_THRESHOLD?j:-1).filter(j=>j>=0),button=$('flyCards').children[i];button.classList.toggle('selected',selected.has(i));button.setAttribute('aria-pressed',String(selected.has(i)));button.setAttribute('aria-label',`${fly.name}. ${fans.length?'Likes '+fans.map(j=>FRUITS[j].name).join(', '):'No learned favorites'}. ${selected.has(i)?'Selected for training':'Select for training'}`);button.innerHTML=`<span class="chef-name">${fly.name}</span><span class="chef-number">0${i+1}</span><span class="taste-icons">${fans.length?fans.map(j=>FRUITS[j].emoji).join(''):'· · ·'}</span><span class="chef-note">${fly.lessons} smell + snack pairings</span>`;});
  text('learnedCount',`${memory.flies.reduce((s,_,i)=>s+changedSynapses(memory,i),0)} changed synapses`);
  text('teach',`Teach ${selected.size} chef${selected.size===1?'':'s'} · 6 snack pairings`);$('teach').disabled=!selected.size;
  drawBrain();
}
function drawBrain() {
  const fruit=Number($('trainingFruit').value),activity=memory.activity[fruit],fly=memory.flies[inspect],rs=responses(memory,inspect);
  text('brainTitle',`${fly.name}’s learned taste response`);
  $('responseBars').innerHTML=FRUITS.map((f,i)=>`<div class="response-row"><span>${f.emoji} ${f.name}</span><div class="bar-track"><i style="width:${Math.min(100,rs[i]/1.5*100)}%;background:${f.color}"></i></div><span>${rs[i].toFixed(2)}${rs[i]>=VOLUNTEER_THRESHOLD?' ✓':''}</span></div>`).join('');
  text('synapseText',`${changedSynapses(memory,inspect)} / 192 KC → MBON strengths changed. Volunteer threshold: 0.72. All untrained responses: 0.20.`);
  const canvas=$('brainCanvas'),c=canvas.getContext('2d'),active=activity.map((v,i)=>({v,i})).filter(x=>x.v>0);c.clearRect(0,0,640,250);c.font='12px system-ui';c.fillStyle='#708367';c.fillText(`${FRUITS[fruit].name.toUpperCase()} SMELL`,14,23);c.fillText('15 ACTIVE KENYON CELLS',170,23);c.fillText('MBON11',490,23);
  active.forEach(({v,i},n)=>{const y=42+n*13;c.beginPath();c.moveTo(90,132);c.lineTo(210,y);c.strokeStyle='#b9c8a9';c.lineWidth=1;c.stroke();c.beginPath();c.moveTo(210,y);c.lineTo(520,132);c.strokeStyle=FRUITS[fruit].color;c.globalAlpha=.25+.6*fly.weights[i]/(memory.initial[i]*1.5);c.lineWidth=.5+2.8*fly.weights[i]/memory.initial[i];c.stroke();c.globalAlpha=1;c.beginPath();c.arc(210,y,3+v*2,0,Math.PI*2);c.fillStyle='#62865a';c.fill();});
  for(const [x,r,color] of [[90,18,FRUITS[fruit].color],[520,22,'#315c49']]){c.beginPath();c.arc(x,132,r,0,Math.PI*2);c.fillStyle=color;c.fill();}c.font='11px system-ui';c.fillStyle='#839175';c.fillText('Real PN → KC contacts',12,243);c.fillText('Line width = simulated KC → MBON strength',280,243);
}
function inspectChef(index) {inspect=index;$('inspectFly').value=String(index);$('brainFly').value=String(index);drawBrain();}
function choose(index) {selected.has(index)?selected.delete(index):selected.add(index);inspectChef(index);memoryUI();}
function makeOrder(recipe) {if(order(game,recipe)){lastPhase='';lastOrder=-1;$('kitchenCanvas').focus({preventScroll:true});beep('order');text('liveStatus',`${recipe.name} ordered. ${FRUITS[game.fruit].name} fans, report to the knife.`);updateUI();}}
function eventUI(event) {
  if(event.type==='slice'){feedback(event.quality);beep('slice');text('liveStatus',`${event.quality} ${FRUITS[game.fruit].name} sliced by blade contact.`);}
  if(event.type==='served'){feedback('ORDER UP!');beep('served');text('liveStatus',`${game.recipe.name} served. ${game.score} points.`);}
  if(event.type==='ready'){beep('ready');text('liveStatus','Knife ready. Press Space or Chop when the marker reaches the green zone.');}
  if(event.type==='ended'){beep('served');feedback('TIME’S UP!');try{const best=Number(localStorage.getItem('fruit-fly-best-v1'))||0;localStorage.setItem('fruit-fly-best-v1',String(Math.max(best,game.score)));}catch{}}
}
function updateUI() {
  const live=memory.flies[inspect].live,flyState=game.world.flies[inspect];
  motorUI.update(game,inspect);
  text('brainSignal',live.fruit===null?'No scent · resting':`${FRUITS[live.fruit].name} scent`);
  text('brainActive',`${live.kc.filter(x=>x>.08).length}`);text('brainOutput',live.mbon.toFixed(2));
  text('brainLocation',flyState.status==='perched'?PERCHES[inspect].name:{approach:'Flying to the knife',attached:'Holding the knife',returning:'Returning to perch'}[flyState.status]);
  text('sniff',`Sniff ${FRUITS[game.fruit??Number($('trainingFruit').value)].name.toLowerCase()}`);
  const motorView=$('brainSource').value==='motor';
  $('sniff').hidden=motorView;
  text('brainActiveLabel',motorView?'ACTIVE FEATURES':'ACTIVE KCs');
  text('brainOutputLabel',motorView?'MOTOR FORCE':'MBON OUTPUT');
  $('brainCaption').textContent=motorView?'Fixed PN → KC · |activity| ×15 · six engineered outputs':'319 neurons · taste activity · schematic positions';
  $('brainCaption').title=motorView?'Flight inputs and six force/torque outputs are engineered. Glows show absolute PN/KC activity amplified 15×; the MBON is not a motor neuron.':'Glows show taste-circuit rate activity, not measured spikes. Positions are illustrative.';
  if(motorView){
    const flight=motorUI.live(inspect,game);
    text('brainSignal',game.motorMode==='autopilot'?'Autopilot · circuit idle':game.motorMode==='untrained'?'Untrained · zero output':flyState.enabled?'Learned flight readout':'Waiting for knife duty');
    text('brainActive',flight.kc.filter(x=>x>.015).length);
    text('brainOutput',flyState.enabled?Math.hypot(flyState.fx,flyState.fy,flyState.fz).toFixed(2):'0.00');
  }
  text('score',game.score.toLocaleString());text('served',game.served);text('clock',game.rush?Math.ceil(game.remaining):'∞');text('clockLabel',game.rush?'SECONDS LEFT':'FREE PLAY');text('combo',game.combo>1?`${game.combo} CUT STREAK ✦`:'');
  text('mode',game.ended?'SHIFT COMPLETE':game.rush?'RUSH HOUR':'KITCHEN OPEN');
  $('chop').disabled=game.phase!=='ready'||paused;$('timingNeedle').style.left=`${game.phase==='ready'?timing(game)*98:0}%`;
  const names=game.crew.map(i=>FLY_NAMES[i]).join(' + '),fruit=FRUITS[game.fruit??0];
  const phaseCopy={idle:['01 / PICK YOUR MIX','What’s on the menu?','Order a bowl to send its fruit fans into action.'],waiting:['02 / A NEW TASTE',`${fruit.name} needs more fans.`,`Teach at least two chefs ${fruit.name.toLowerCase()} in Taste school below.`],recruit:['02 / CALL THE CREW',`${fruit.name} fans, assemble!`,`${names} are reporting for knife duty.`],lift:['03 / LIFT TOGETHER','Tiny chefs. Big knife.','The volunteers are lifting with bounded physical forces.'],ready:['04 / MAKE IT COUNT','Ready, steady… chop!','Hit Space or Chop when the marker enters the green zone.'],cut:['04 / KNIFE IN MOTION','Here comes the chop!','A slice only counts when the moving blade touches fruit.'],plate:['05 / INTO THE BOWL',game.lastQuality,'Freshly sliced and heading to your salad.'],return:['05 / CHANGE OF CREW','Back to the chopping board.','The crew lowers the knife before handing it over.'],served:['06 / ORDER UP!',`${game.recipe?.name??'Salad'} served!`,'Pick another bowl. Your chefs remember what they learned.'],ended:['SHIFT COMPLETE',`${game.served} bowls. ${game.score} points.`,'Play another rush or take your time in free play.']};
  if(lastPhase!==game.phase||lastOrder!==game.orderId){lastPhase=game.phase;lastOrder=game.orderId;const [step,title,hint]=phaseCopy[game.phase];text('stepLabel',step);text('actionTitle',title);text('actionHint',hint);text('crewStatus',['idle','served','ended'].includes(game.phase)?'8 tiny chefs, reporting for duty':game.phase==='waiting'?`${game.crew.length}/2 volunteers · training needed`:`${game.crew.length} volunteers · ${names}`);text('ticketName',game.recipe?.name??'Your order will appear here');
    $('ticketFruits').innerHTML=game.recipe?game.recipe.fruits.map((f,i)=>`<span title="${FRUITS[f].name}${i<game.index?' sliced':''}" class="ticket-fruit ${i<game.index?'done':i===game.index?'current':''}">${FRUITS[f].emoji}</span>`).join(''):'';
    [...$('recipes').children].forEach((button,i)=>{button.disabled=!idle();button.classList.toggle('active',game.recipe?.name===RECIPES[i].name&&!idle());});$('customOrder').disabled=!idle()||!custom.size;$('cancelOrder').hidden=idle()||game.ended;
    const show=game.ended||game.phase==='served';$('roundResult').hidden=!show;
    if(show){if(game.ended){let best=game.score;try{best=Math.max(best,Number(localStorage.getItem('fruit-fly-best-v1'))||0);}catch{}$('roundResult').innerHTML=`<b>Nice shift, chef!</b>${game.served} bowls · ${game.score} points<br>Best rush: ${best}<br><button id="freePlay">Back to free play →</button>`;$('freePlay').onclick=()=>{game=newGame();lastPhase='';updateUI();};}else $('roundResult').innerHTML='<b>That’s one happy customer. ✦</b>+200 bowl bonus. Choose the next recipe!';}
  }
}
function init() {
  $('flyCards').replaceChildren(...FLY_NAMES.map((_,i)=>{const b=document.createElement('button');b.className='fly-card';b.onclick=()=>choose(i);return b;}));
  $('inspectFly').innerHTML=FLY_NAMES.map((name,i)=>`<option value="${i}">${name}</option>`).join('');$('inspectFly').onchange=()=>inspectChef(Number($('inspectFly').value));
  $('brainFly').innerHTML=$('inspectFly').innerHTML;$('brainFly').onchange=()=>inspectChef(Number($('brainFly').value));
  $('sniff').onclick=()=>sniff(memory,inspect,game.fruit??Number($('trainingFruit').value));
  $('recipes').replaceChildren(...RECIPES.map((recipe,i)=>{const b=document.createElement('button');b.className='recipe';b.setAttribute('aria-label',`Order ${recipe.name}: ${recipe.fruits.map(f=>FRUITS[f].name).join(', ')}`);b.innerHTML=`<span class="emoji-row">${recipe.fruits.map(f=>FRUITS[f].emoji).join('')}</span><span class="recipe-name">${recipe.name}</span><span class="recipe-note">${recipe.subtitle}</span><span class="arrow">↗</span>`;b.onclick=()=>makeOrder(recipe);return b;}));
  $('customFruits').replaceChildren(...FRUITS.map((f,i)=>{const b=document.createElement('button');b.textContent=f.emoji;b.setAttribute('aria-label',f.name);b.setAttribute('aria-pressed',String(custom.has(i)));b.onclick=()=>{custom.has(i)?custom.delete(i):custom.add(i);b.setAttribute('aria-pressed',String(custom.has(i)));$('customOrder').disabled=!idle()||!custom.size;};return b;}));
  $('customOrder').onclick=()=>makeOrder({name:'Chef’s special',fruits:[...custom]});
  $('chop').onclick=()=>chop(game);
  $('cancelOrder').onclick=()=>{const previous=game;game=newGame();for(const key of ['score','served','cutCount','rush','remaining'])game[key]=previous[key];lastPhase='';lastOrder=-1;updateUI();};
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['BUTTON','SELECT','INPUT','SUMMARY','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();chop(game);}});
  $('trainingFruit').onchange=drawBrain;
  $('teach').onclick=()=>{const fruit=Number($('trainingFruit').value),before=recruit(memory,fruit).length,changes=teach(memory,[...selected],fruit,6);memoryUI();refreshCrew(game);if(game.phase==='recruit')$('kitchenCanvas').focus({preventScroll:true});lastPhase='';const unique=new Set(changes.map(c=>`${c.fly}:${c.kc}`)).size;text('trainingFeedback',`${unique} synapses strengthened. ${FRUITS[fruit].name} volunteers: ${before} → ${recruit(memory,fruit).length}. ${[...selected].map(i=>FLY_NAMES[i]).join(' + ')} learned through six pairings each.`);feedback('NEW TASTE!');beep('teach');updateUI();};
  $('selectPair').onclick=()=>{selected=new Set([0,4]);memoryUI();};
  $('clearMemory').onclick=()=>{resetMemory(memory);game=newGame();lastPhase='';lastOrder=-1;memoryUI();updateUI();text('trainingFeedback','Learning cleared. Nobody volunteers until you train them. Starter crew can be restored at any time.');};
  $('starterMemory').onclick=()=>{resetMemory(memory);[0,1,2,0,1,2,0,1].forEach((fruit,i)=>teach(memory,[i],fruit,6,'starter'));game=newGame();lastPhase='';lastOrder=-1;memoryUI();updateUI();text('trainingFeedback','Starter training restored: apple, orange and strawberry fans are ready. Kiwi still needs a lesson.');};
  $('rush').onclick=()=>{game=newGame();startRush(game);lastPhase='';lastOrder=-1;updateUI();text('liveStatus','90-second rush started. Choose your first order.');text('rush','Restart 90-second rush ↗');};
  $('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));text('sound',sound?'Sound on':'Sound off');beep('teach');};
  $('camera').onclick=()=>view.resetCamera();
  document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=performance.now();accumulator=0;});
  memoryUI();updateUI();
}
function frame(now) {
  const elapsed=Math.min(.1,(now-last)/1000);last=now;
  if(!paused){accumulator+=elapsed;while(accumulator>=DT){stepGame(game,DT);accumulator-=DT;}for(const e of game.events.splice(0))eventUI(e);view.render(game,selected,inspect);brainPanel.render(inspect,game.time,$('brainSource').value==='motor'?motorUI.live(inspect,game):null);uiTick+=elapsed;if(uiTick>.04){updateUI();uiTick=0;}}
  requestAnimationFrame(frame);
}
try {const response=await fetch('./data/circuit.json');if(!response.ok)throw new Error('Circuit data could not be loaded.');const circuit=await response.json();memory=createMemory(circuit);game=newGame();motorUI=await createMotorUI(circuit,memory,{onChange:(mode,swarm)=>{setMotorMode(game,mode,swarm);lastPhase='';updateUI();},onRestart:()=>{game=newGame();lastPhase='';lastOrder=-1;updateUI();text('motorTrainingStatus','Fresh round. Flight lesson and fruit tastes preserved. Choose an order.');}});game=newGame();view=createSaladView($('kitchenCanvas'),{onSelect:inspectChef,onError:message=>{$('graphicsError').hidden=false;text('graphicsError',message);}});brainPanel=createBrainPanel($('neuralScope'),memory);init();requestAnimationFrame(frame);}catch(error){$('graphicsError').hidden=false;text('graphicsError',`Kitchen could not start: ${error.message}. Open the original physics lab below, or reload with WebGL enabled.`);console.error(error);}
