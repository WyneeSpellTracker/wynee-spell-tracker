/* Wynee V11 — voz experimental, sin modificar los modos existentes. */
(()=>{'use strict';
const $=id=>document.getElementById(id), Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
const roles={meet:'MID',mir:'MID',expy:'EXP',espn:'EXP',esp:'EXP',xpi:'EXP',lexpi:'EXP',lekespi:'EXP',espi:'EXP',rome:'ROAM',ramel:'ROAM',run:'ROAM',super:'ROAM',loro:'ORO',dc:'ORO',exp:'EXP',xp:'EXP',expi:'EXP',esnp:'EXP',spy:'EXP',mid:'MID',mit:'MID',mago:'MID',mugo:'MID',medio:'MID',roam:'ROAM',roamer:'ROAM',romer:'ROAM',pamer:'ROAM',supo:'ROAM',tanque:'ROAM',support:'ROAM',sup:'ROAM',oro:'ORO',gold:'ORO',adc:'ORO',adeces:'ORO',adece:'ORO',mm:'ORO',tirador:'ORO',jg:'JUNGLA',jungla:'JUNGLA',jungle:'JUNGLA'};
const spells={f:['f','Parpadeo',120],p:['f','Parpadeo',120],parpadeo:['f','Parpadeo',120],flicker:['f','Parpadeo',120],flickr:['f','Parpadeo',120],retri:['retri','Retribución',35],r:['retri','Retribución',35],retribucion:['retri','Retribución',35],a:['a','Aegis',75],ax:['a','Aegis',75],aegis:['a','Aegis',75],egis:['a','Aegis',75],i:['i','Inspirar',75],inspirar:['i','Inspirar',75],v:['v','Venganza',75],venganza:['v','Venganza',75],petri:['petri','Petrificar',60],petrificar:['petri','Petrificar',60],re:['re','Revitalizar',60],revitalizar:['re','Revitalizar',60],puri:['puri','Purificar',90],purificar:['puri','Purificar',90],s:['s','Sprint',100],sprint:['s','Sprint',100],flanshot:['flameshot','Flameshot',50],flynn:['flameshot','Flameshot',50],flynnshot:['flameshot','Flameshot',50],flinshot:['flameshot','Flameshot',50],fliker:['f','Parpadeo',120],fliker:['f','Parpadeo',120],flameshot:['flameshot','Flameshot',50],flamechot:['flameshot','Flameshot',50],flame:['flameshot','Flameshot',50],fleimshot:['flameshot','Flameshot',50],fleinshot:['flameshot','Flameshot',50],flanchott:['flameshot','Flameshot',50],flanchut:['flameshot','Flameshot',50],flexshot:['flameshot','Flameshot',50],flanchot:['flameshot','Flameshot',50]};
const unit={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,treinta:30,cuarenta:40,cincuenta:50};
const tens={veinti:20,treinta:30,cuarenta:40,cincuenta:50, sesenta:60, setenta:70, ochenta:80, noventa:90};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9: ]/g,' ').replace(/\s+/g,' ').trim();
function num(a){if(!a.length)return null;let v=a.join(' ');if(/^\d{1,3}$/.test(v))return Number(v);if(a.length===1){if(unit[v]!=null)return unit[v];if(/^veinti[a-z]+$/.test(v)&&unit[v.slice(6)]!=null)return 20+unit[v.slice(6)];}if(a.length===3&&a[1]==='y'&&unit[a[2]]!=null&&unit[a[2]]<10&&tens[a[0]]!=null)return tens[a[0]]+unit[a[2]];return null}
function time(a){if(!a.length)return null;const joined=a.join(' ');const colon=joined.match(/^(\d{1,3}):(\d{1,2})$/);if(colon&&Number(colon[2])<60)return Number(colon[1])*60+Number(colon[2]);if(a.length===1&&/^\d{2,5}$/.test(a[0])){const n=a[0],sec=Number(n.slice(-2));return sec<60?Number(n.slice(0,-2))*60+sec:null}if(a[0]==='minuto'||a[0]==='minutos')a=a.slice(1);for(let i=1;i<a.length;i++){let left=a.slice(0,i),right=a.slice(i);if(right[0]==='minuto'||right[0]==='minutos'||right[0]==='con')right=right.slice(1);const m=num(left),s=num(right);if(m!=null&&s!=null&&s<60&&m<=999)return m*60+s}return null}
function tokens(raw){
 // Normalización de errores frecuentes de dictado del español mexicano.
 const a=norm(raw).replace(/\b(?:cool\s*down|cooldown|old\s*down|un\s*down|pull\s*down|full\s*down|cole\s*down|cul\s*down)\b/g,'cooldown')
  .replace(/\b(?:flin|flynn|flan)\s*shot\b/g,'flameshot')
  .replace(/\b(?:espn|espn?\s+fliker)\b/g,m=>m.startsWith('espn')?'exp':'exp')
  .replace(/\b(?:le\s*kespi|le\s*xpi|la\s*dc|la\s+de\s+ce|del\s+loro)\b/g,m=>m.includes('dc')||m.includes('ce')||m.includes('loro')?'oro':'exp')
  .split(' ').filter(Boolean),b=[];for(let i=0;i<a.length;i++){if(a[i]==='e'&&a[i+1]==='xp'){b.push('exp');i++}else if(a[i]==='a'&&a[i+1]==='x'){b.push('ax');i++}else if(a[i]==='a'&&a[i+1]==='dc'){b.push('adc');i++}else if(a[i]==='a'&&a[i+1]==='d'&&a[i+2]==='c'){b.push('adc');i+=2}else if(a[i]==='a'&&a[i+1]==='de'&&['ce','c','se'].includes(a[i+2])){b.push('adc');i+=2}else if(a[i]==='ad'&&a[i+1]==='c'){b.push('adc');i++}else if(a[i]==='m'&&a[i+1]==='i'&&a[i+2]==='d'){b.push('mid');i+=2}else if(a[i]==='alexpi'){b.push('al','expi')}else if(a[i]==='flynn'&&a[i+1]==='shot'){b.push('flameshot');i++}else if(a[i]==='flan'&&a[i+1]==='shot'){b.push('flameshot');i++}else b.push(a[i])}return b}
function context(){const room=$('roomPage');if(room&&!room.hidden&&!$('roomWorkspace').hidden){const title=$('roomTitle').textContent;return{kind:'room',quick:title.includes('RÁPIDO'),advanced:(title.includes('AVANZADO')||title.includes('EMBLEMA')),input:'roomCommand',form:'roomForm',status:'roomStatus'}}if(!$('calculatorPage')?.hidden){if(!$('quickMode').hidden)return{kind:'quick',quick:true,input:'quickCmd',form:'quickForm',status:'quickStatus'};if(!$('tacticalMode').hidden)return{kind:'tactical',quick:false,input:'cmd',form:'form',status:'status'};if(!$('advancedMode').hidden)return{kind:'advanced',quick:false,advanced:true,input:'advancedCmd',form:'advancedForm',status:'advancedStatus'}}return null}
function parseCommands(raw,quick){let a=tokens(raw),segments=[],errors=[];if(!a.length)return{segments,errors:['Frase vacía']};let starts=[];for(let i=0;i<a.length;i++)if(roles[a[i]]&&(!quick||a.length>2))starts.push(i);if(quick&&!starts.length){starts=[0]}if(!starts.length){errors.push('No se reconoció ningún rol');return{segments,errors}}if(starts[0]>0)errors.push('Inicio no reconocido');for(let k=0;k<starts.length;k++){const seg=a.slice(starts[k],starts[k+1]??a.length).filter(x=>!['luego','despues'].includes(x));let role=null,spell=null,offset=0;if(roles[seg[0]]){role=roles[seg[0]];offset=1}if(!quick&&!role){errors.push('Falta rol');continue}spell=spells[seg[offset]];if(!spell){errors.push((role||'Comando')+': hechizo no reconocido');continue}const t=time(seg.slice(offset+1));if(t===null||t>59999){errors.push((role||'Comando')+': minuto no reconocido');continue}segments.push({role,spell:spell[1],code:spell[0],cd:spell[2],used:t,raw:(quick?'':({EXP:'exp',MID:'mid',ROAM:'roam',ORO:'oro',JUNGLA:'jg'}[role]+' '))+spell[0]+' '+String(Math.floor(t/60))+String(t%60).padStart(2,'0')})}return{segments,errors}}
function query(raw){
 const a=tokens(raw),all=a.join(' ');
 // Consultas de todos los roles: cooldown, cool down y sus variantes plurales.
 if(/^(?:cool ?downs?|cd|revisa|revisar|consulta|consultar|checa) (?:de |del |a |a los |los )?(?:todos|todas|todo|los cooldowns|todos los cooldowns)$/.test(all)
    || /^(?:todos los cool ?downs|cool ?down de todos|cool ?downs de todos|revisa a todos)$/.test(all))return{all:true};
 // Solo consultas expresas: no confundir con registro de hechizos.
 if(/^(?:cool ?downs?|cd|revisa|revisar|consulta|consultar|checa)(?: |$)/.test(all)){
   const rest=a.slice(a[0]==='cool'&&a[1]==='down'?2:1);
   const role=rest.filter(x=>!['al','a','el','la','los','las','del','de'].includes(x)).find(x=>roles[x]);
   if(role)return{role:roles[role]};
 }
 return null;
}
const fmt=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
const voiceRole=role=>({MID:'medio',EXP:'EXP',JUNGLA:'jungla',ROAM:'roamer',ORO:'oro'}[role]||role);
const spoken=n=>{let m=Math.floor(n/60),s=n%60;return m+' '+String(s).padStart(2,'0')};
function latest(){const ctx=context();if(!ctx)return[];if(ctx.kind==='room')return window.wyneeRoomRecords||[];let key=ctx.kind==='tactical'?'wynee-spell-tracker-individual-v1':ctx.kind==='advanced'?'wynee-spell-tracker-v9-advanced':'wynee-spell-tracker-v9-quick';try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
let active=false,recognition=null,starting=false,speaking=false,queue=Promise.resolve(),roomRecords=[],last=new Map();
let remindersEnabled=false,reminderTimer=null,handlingCommands=0,reminderSpeaking=false;
function reminderCandidates(){
  const ctx=context();
  if(!ctx||ctx.quick)return [];
  const data=latest(),seen=new Set(),items=[];
  // Las listas locales están ordenadas de antiguo a nuevo; las salas, de nuevo a antiguo.
  const ordered=ctx.kind==='room'?data:[...data].reverse();
  for(const x of ordered){
    if(!x||!x.role||seen.has(x.role)||!Number.isFinite(Number(x.ready)))continue;
    seen.add(x.role);items.push(x);
  }
  return items.sort((a,b)=>Number(a.ready)-Number(b.ready)||String(a.role).localeCompare(String(b.role))).slice(0,3);
}
function clearReminderTimer(){if(reminderTimer!==null){clearInterval(reminderTimer);reminderTimer=null}}
function ensureReminderTimer(){
  clearReminderTimer();
  if(!remindersEnabled)return;
  reminderTimer=setInterval(()=>{
    if(!remindersEnabled||speaking||handlingCommands)return;
    const items=reminderCandidates();
    if(!items.length)return;
    const lines=items.map(x=>voiceRole(x.role)+' recupera '+x.spell+' al minuto '+spoken(Number(x.ready)));
    info('🔔 Recordatorio: '+items.map(x=>x.role+' '+x.spell+' '+fmt(Number(x.ready))).join(' · '));
    queue=queue.then(async()=>{if(remindersEnabled&&!handlingCommands&&!speaking){reminderSpeaking=true;try{await speak(lines)}finally{reminderSpeaking=false}}}).catch(e=>info('Error de recordatorio: '+e.message));
  },30000);
}
function reminderCommand(raw){
  const a=norm(raw).replace(/^wyne(e)? /,'').replace(/^oye wyne(e)? /,'');
  if(!/\b(alertas?|recordatorios?)\b/.test(a))return null;
  if(/\b(desactiva|desactivar|desactivadas?|apaga|apagar)\b/.test(a))return false;
  if(/\b(activa|activar|activadas?|enciende|encender)\b/.test(a))return true;
  return null;
}
window.wyneeRoomRecords=roomRecords;
const style=document.createElement('style');style.textContent=`#wyneeVoiceDock{position:fixed;right:16px;bottom:18px;z-index:9990;display:flex;gap:8px;align-items:center}#wyneeVoiceDock button{border-radius:999px;box-shadow:0 6px 24px #0009;padding:12px 16px;font-weight:800}#wyneeMic.active{outline:2px solid #58db9a}#wyneeVoiceGuide{position:fixed;inset:0;background:#000b;z-index:9995;display:none;align-items:center;justify-content:center;padding:14px}#wyneeVoiceGuide.open{display:flex}#wyneeVoiceGuide .v-card{background:#16141d;color:#f8f4ff;border:1px solid #746078;border-radius:18px;width:min(690px,100%);max-height:90vh;overflow:auto;padding:20px}#wyneeVoiceGuide table{width:100%;border-collapse:collapse;font-size:14px}#wyneeVoiceGuide td,#wyneeVoiceGuide th{padding:9px 5px;border-bottom:1px solid #55475a;text-align:left;vertical-align:top}#wyneeVoiceGuide .v-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#wyneeVoiceGuide .v-tabs button{padding:8px 10px}#wyneeVoiceGuide .v-tabs button.selected{outline:2px solid #9cdbff}#wyneeVoiceGuide .v-tab[hidden]{display:none}#wyneeVoiceToast{position:fixed;bottom:82px;right:14px;z-index:9991;max-width:min(420px,calc(100vw - 28px));background:#201d2b;border:1px solid #66566d;border-radius:12px;color:white;padding:10px 13px;font-size:13px;box-shadow:0 5px 25px #0009}#wyneeVoiceToast[hidden]{display:none}#wyneeVoiceTranscript{margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #66566d;line-height:1.4;overflow-wrap:anywhere}#wyneeVoiceTranscript .wynee-transcript-label{display:block;font-size:11px;color:#c6b5d6;margin-bottom:3px}#wyneeVoiceTranscriptText{font-weight:650}#wyneeVoiceTranscriptText.interim{opacity:.7;font-style:italic}#wyneeVoiceFeedback{line-height:1.35;overflow-wrap:anywhere}`;document.head.append(style);
const tip=document.createElement('div');
tip.id='wyneeReminderTip';
tip.setAttribute('role','note');
tip.innerHTML='<span aria-hidden="true">💡</span> <span><b>Tip de Wynee Voice:</b> Escribe o di «Wynee, activa los recordatorios» y cada 30 segundos te dirá los <b>3 hechizos que se recuperan primero</b>. Para detenerlos, escribe o di «Wynee, desactiva los recordatorios».</span>';
const tipClose=document.createElement('button');
tipClose.type='button';tipClose.textContent='×';tipClose.setAttribute('aria-label','Cerrar consejo de voz');
tipClose.style.cssText='border:0;background:transparent;color:#d9c8d6;font-size:19px;line-height:1;cursor:pointer;padding:0 0 0 4px';
tipClose.onclick=()=>tip.remove();
tip.append(tipClose);
document.body.append(tip);
const tipStyle=document.createElement('style');
tipStyle.textContent='#wyneeReminderTip{position:fixed;right:16px;bottom:140px;z-index:9989;width:min(360px,calc(100vw - 32px));display:flex;gap:9px;align-items:flex-start;background:#201b27;border:1px solid #76546a;border-radius:12px;padding:11px 13px;color:#eee3ef;font-size:12px;line-height:1.45;box-shadow:0 6px 24px #0009}#wyneeReminderTip b{color:#fff}#wyneeReminderTip span:first-child{font-size:16px}@media(max-width:560px){#wyneeReminderTip{bottom:132px;font-size:11px;max-width:calc(100vw - 32px)}}';
document.head.append(tipStyle);
const dock=document.createElement('div');dock.id='wyneeVoiceDock';dock.innerHTML='<button type="button" id="wyneeGuideButton" title="Guía de voz">📖 Guía de voz</button><button type="button" id="wyneeMic" aria-pressed="false">🎙️ Activar voz</button>';document.body.append(dock);
const toast=document.createElement('div');toast.id='wyneeVoiceToast';toast.hidden=true;toast.setAttribute('role','status');
const transcriptBox=document.createElement('div');transcriptBox.id='wyneeVoiceTranscript';transcriptBox.hidden=true;
const transcriptLabel=document.createElement('span');transcriptLabel.className='wynee-transcript-label';transcriptLabel.textContent='🎙️ Lo que entiende el micrófono:';
const transcriptText=document.createElement('span');transcriptText.id='wyneeVoiceTranscriptText';
transcriptBox.append(transcriptLabel,transcriptText);
const feedback=document.createElement('div');feedback.id='wyneeVoiceFeedback';
const toastClose=document.createElement('button');toastClose.type='button';toastClose.textContent='×';toastClose.setAttribute('aria-label','Cerrar mensaje de Wynee Voice');toastClose.style.cssText='position:absolute;top:4px;right:5px;background:transparent;color:#ffd8e2;border:0;font-size:22px;cursor:pointer;line-height:1;padding:4px 8px';toastClose.addEventListener('click',()=>{toast.hidden=true});toast.style.position='fixed';toast.style.paddingRight='35px';toast.append(transcriptBox,feedback,toastClose);document.body.append(toast);
function info(t){feedback.textContent=t;toast.hidden=false}
function heard(t,final=false){if(!t.trim())return;transcriptBox.hidden=false;transcriptText.textContent='«'+t.trim()+'»';transcriptText.classList.toggle('interim',!final);toast.hidden=false}
const guide=document.createElement('div');guide.id='wyneeVoiceGuide';guide.setAttribute('role','dialog');guide.setAttribute('aria-modal','true');guide.setAttribute('aria-label','Guía de voz');guide.innerHTML=`<div class="v-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h2 style="margin:0">📖 Guía de voz · V11</h2><button type="button" id="wyneeGuideClose">✕ Cerrar</button></div><p>Puedes escribir estos comandos o activar el micrófono para decirlos. Wynee responderá en voz alta en ambos casos. Algunas variantes de reconocimiento se corrigen automáticamente.</p><div class="v-tabs"><button type="button" data-guide="roles">Roles</button><button type="button" data-guide="spells">Hechizos</button><button type="button" data-guide="queries">Consultas CD</button><button type="button" data-guide="examples">Cómo usar</button></div><section class="v-tab" data-tab="roles"><table><tr><th>Rol</th><th>Palabras reconocidas</th></tr><tr><td>EXP</td><td>EXP, XP, Expy, Espn, Xpi</td></tr><tr><td>MID</td><td>MID, Mago, Medio, Mir, Meet</td></tr><tr><td>ROAM</td><td>Roam, Roamer, Rome, Ramel, Tanque, Support</td></tr><tr><td>ORO</td><td>Oro, Gold, Loro, Tirador, ADC, MM</td></tr><tr><td>JUNGLA</td><td>JG, Jungla, Jungle</td></tr></table></section><section class="v-tab" data-tab="spells" hidden><table><tr><th>Hechizo</th><th>Palabras reconocidas</th></tr><tr><td>Parpadeo</td><td>Parpadeo, Flicker, Flickr, F, P</td></tr><tr><td>Purificar</td><td>Purificar, Puri</td></tr><tr><td>Petrificar</td><td>Petrificar, Petri</td></tr><tr><td>Aegis</td><td>Aegis, A</td></tr><tr><td>Retribución</td><td>Retribución, Retri, R</td></tr><tr><td>Inspirar</td><td>Inspirar, I</td></tr><tr><td>Venganza</td><td>Venganza, V</td></tr><tr><td>Revitalizar</td><td>Revitalizar, Re</td></tr><tr><td>Sprint</td><td>Sprint, S</td></tr><tr><td>Flameshot</td><td>Flameshot, Flame, Flanshot, Flynn Shot</td></tr></table></section><section class="v-tab" data-tab="queries" hidden><table><tr><th>Comando</th><th>Consulta</th></tr><tr><td>Cooldown EXP / Cooldown del EXP / Revisa al EXP</td><td>Último EXP</td></tr><tr><td>Cooldown MID / Cooldown del mago / Revisa al mago</td><td>Último MID</td></tr><tr><td>Cooldown ORO / Cooldown del tirador / Revisa al tirador</td><td>Último ORO</td></tr><tr><td>Cooldown ROAM / Cooldown del roamer / Revisa al roamer</td><td>Último ROAM</td></tr><tr><td>Cooldown JUNGLA / Cooldown del jungla / Revisa al jungla</td><td>Último JUNGLA</td></tr><tr><td>Cooldown de todos / Todos los cooldowns / Revisa a todos</td><td>Último cooldown de cada rol</td></tr><tr><td>Activa los recordatorios / Desactiva los recordatorios</td><td>Lee cada 30 segundos los tres roles con recuperación más próxima</td></tr></table></section><section class="v-tab" data-tab="examples" hidden><p><b>Registro:</b> «EXP parpadeo tres veintiuno» o «EXP F 321».</p><p><b>Varios:</b> «EXP F 321, mago purificar 332, roamer petri 340».</p><p><b>Consulta:</b> «Cooldown EXP», «Cooldown del EXP», «Revisa al EXP» o «Todos los cooldowns».</p><p><b>Minutos:</b> puedes decir «tres veintiuno», «tres minutos veintiuno» o «321». Si no entiende, repite solo el comando que falló.</p><p><b>¿No reconoce un rol o hechizo?</b> Prueba con otro nombre o sinónimo. Por ejemplo, si no reconoce «MID», di «Medio» o «Mago». Consulta las pestañas Roles y Hechizos para ver las alternativas.</p><p><b>Importante:</b> para consultas por rol, usa modo Estándar, Emblema o una sala con roles. En modo Rápido no hay roles.</p></section></div>`;document.body.append(guide);
function tab(name){guide.querySelectorAll('[data-tab]').forEach(x=>x.hidden=x.dataset.tab!==name);guide.querySelectorAll('[data-guide]').forEach(x=>x.classList.toggle('selected',x.dataset.guide===name))}tab('roles');
$('wyneeGuideButton').onclick=()=>{guide.classList.add('open');tab('roles')};$('wyneeGuideClose').onclick=()=>guide.classList.remove('open');guide.addEventListener('click',e=>{if(e.target===guide)guide.classList.remove('open');if(e.target.dataset.guide)tab(e.target.dataset.guide)});document.addEventListener('keydown',e=>{if(e.key==='Escape')guide.classList.remove('open')});
function speak(lines){if(!lines.length||!('speechSynthesis'in window))return Promise.resolve();return new Promise(resolve=>{speaking=true;try{recognition?.abort()}catch{}const utter=new SpeechSynthesisUtterance(lines.join('. '));utter.lang='es-MX';utter.rate=1.13;let done=false;const finish=()=>{if(done)return;done=true;speaking=false;resolve();if(active)restart(550)};utter.onend=finish;utter.onerror=finish;window.speechSynthesis.cancel();window.speechSynthesis.speak(utter);setTimeout(finish,Math.max(6000,lines.join(' ').length*130))})}
function getReady(item,ctx){let cd=item.cd;if(ctx.advanced){let k=Number($(ctx.kind==='room'?'roomKills':'kills')?.value||0),a=Number($(ctx.kind==='room'?'roomAssists':'assists')?.value||0);if(!Number.isInteger(k)||!Number.isInteger(a)||k<0||a<0||k>999||a>999)throw Error('Kills y asistencias inválidas');cd=Math.ceil(cd*(100-(12+Math.min(8,k+a)))/100)}return item.used+cd}
function savedLocal(ctx,before){const key=ctx.kind==='tactical'?'wynee-spell-tracker-individual-v1':ctx.kind==='advanced'?'wynee-spell-tracker-v9-advanced':'wynee-spell-tracker-v9-quick';try{const a=JSON.parse(localStorage.getItem(key)||'[]');return a.length===before+1||a.length===500||a.length===3}catch{return false}}
let internalSubmit=false;
function submitInternally(form){internalSubmit=true;try{form.requestSubmit()}finally{internalSubmit=false}}
function roomSave(command){voiceRoomSavePending++;return new Promise((resolve,reject)=>{const success=e=>{cleanup();resolve(e.detail.record)},error=e=>{cleanup();reject(Error(e.detail.message))};const timer=setTimeout(()=>{cleanup();reject(Error('La sala no confirmó el registro'))},14000);function cleanup(){voiceRoomSavePending=Math.max(0,voiceRoomSavePending-1);clearTimeout(timer);window.removeEventListener('wynee:room-saved',success);window.removeEventListener('wynee:room-save-error',error)}window.addEventListener('wynee:room-saved',success);window.addEventListener('wynee:room-save-error',error);$('roomCommand').value=command;submitInternally($('roomForm'))})}
async function register(items,errors,ctx){const lines=[];for(const item of items){const now=Date.now(),id=(ctx.kind==='room'?'room':'local')+':'+item.raw;if(now-(last.get(id)||0)<6500){errors.push(item.role+' repetido');continue}try{let ready=getReady(item,ctx);if(ctx.kind==='room'){await roomSave(item.raw)}else{const input=$(ctx.input),form=$(ctx.form),key=ctx.kind==='tactical'?'wynee-spell-tracker-individual-v1':ctx.kind==='advanced'?'wynee-spell-tracker-v9-advanced':'wynee-spell-tracker-v9-quick';let before=0;try{before=JSON.parse(localStorage.getItem(key)||'[]').length}catch{}input.value=item.raw;submitInternally(form);if(!savedLocal(ctx,before))throw Error($(ctx.status)?.textContent||'No se pudo guardar')}last.set(id,Date.now());lines.push((item.role?voiceRole(item.role):item.spell)+' recupera al '+spoken(ready))}catch(e){errors.push((item.role||item.spell)+': '+e.message)}}if(errors.length)lines.push(errors.length+' comando'+(errors.length===1?'':'s')+' no reconocido'+(errors.length===1?'':'s'));info(lines.join(' · ')||'No reconocí el comando');await speak(lines)}
async function consult(q){const ctx=context();if(!ctx){info('Entra a un modo o sala para consultar.');return}if(ctx.quick){info('El modo rápido no guarda roles. Usa Estándar, Emblema o una sala con roles.');await speak(['El modo rápido no tiene roles']);return}let data=latest();const rolesWanted=q.all?['EXP','MID','JUNGLA','ROAM','ORO']:[q.role];let lines=rolesWanted.map(role=>{const item=ctx.kind==='room'?data.find(x=>x.role===role):[...data].reverse().find(x=>x.role===role);return item?role+' tiene '+item.spell+' al minuto '+spoken(item.ready):'No hay cooldown registrado para '+role});info(lines.join(' · '));await speak(lines.map(line=>line.replace(/^MID\b/,'medio').replace(/\bMID\b/g,'medio')))}
async function handle(raw){heard(raw,true);info('Procesando comando…');const setting=reminderCommand(raw);if(setting!==null){remindersEnabled=setting;ensureReminderTimer();info(setting?'🔔 Recordatorios activados: tres próximos cooldowns cada 30 segundos.':'🔕 Recordatorios desactivados.');await speak([setting?'Recordatorios activados':'Recordatorios desactivados']);return}const ctx=context();if(!ctx){info('Abre un modo o entra a una sala antes de dictar');return}const q=query(raw);if(q)return consult(q);const {segments,errors}=parseCommands(raw,ctx.quick);if(!segments.length){info('Comando desconocido: '+errors.join(' · ')+'. Revisa arriba lo que entendió el micrófono.');return speak(['Comando no reconocido'])}return register(segments,errors,ctx)}
function restart(delay=450){if(!active||speaking||starting||!recognition)return;setTimeout(()=>{if(!active||speaking||starting)return;try{starting=true;recognition.start()}catch{starting=false}},delay)}
function stop(){active=false;starting=false;try{recognition?.abort()}catch{}$('wyneeMic').textContent='🎙️ Activar voz';$('wyneeMic').classList.remove('active');$('wyneeMic').setAttribute('aria-pressed','false');info('Micrófono apagado')}
function start(){if(!Speech){info('Tu navegador no permite reconocimiento de voz. Prueba Chrome.');return}active=true;recognition=new Speech();ensureReminderTimer();recognition.lang='es-MX';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;recognition.onstart=()=>{starting=false;info('🎙️ Escuchando…')};recognition.onresult=e=>{let interim='',finalPhrases=[];for(let i=e.resultIndex;i<e.results.length;i++){const phrase=e.results[i][0]?.transcript||'';if(e.results[i].isFinal){if(phrase.trim())finalPhrases.push(phrase.trim())}else interim+=phrase}if(interim.trim())heard(interim,false);for(const phrase of finalPhrases){heard(phrase,true);queue=queue.then(async()=>{handlingCommands++;try{await handle(phrase)}finally{handlingCommands--}}).catch(err=>info('Error de voz: '+err.message))}};recognition.onerror=e=>{starting=false;info('Micrófono: '+e.error);if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error))stop()};recognition.onend=()=>{starting=false;restart(650)};$('wyneeMic').textContent='🔴 Detener voz';$('wyneeMic').classList.add('active');$('wyneeMic').setAttribute('aria-pressed','true');restart(0)}
$('wyneeMic').onclick=()=>{if(active&&reminderSpeaking){window.speechSynthesis?.cancel();reminderSpeaking=false;speaking=false;restart(0);info('🎙️ Aviso interrumpido. Escuchando tu comando…');return}active?stop():start()};window.addEventListener('pagehide',()=>{clearReminderTimer();stop();window.speechSynthesis?.cancel()});window.addEventListener('wynee:room-records',e=>{roomRecords=e.detail.records;window.wyneeRoomRecords=roomRecords});
// Mantener intacto el submit original de las calculadoras. Solo se interceptan
// comandos de configuración y consultas, nunca registros normales.
['quickForm','form','advancedForm','roomForm','roomEmblemForm'].forEach(formId=>{
 const form=$(formId);if(!form)return;
 form.addEventListener('submit',event=>{
  if(internalSubmit)return;
  const input=form.querySelector('input[type="text"],input:not([type]),textarea');
  const command=input?.value?.trim();if(!command)return;
  // Los recordatorios se pueden activar y desactivar escribiendo en cualquier
  // calculadora, incluyendo las dos pestañas de Salas compartidas.
  // No depende del estado del microfono y no envia el texto a Firebase.
  const reminderSetting=reminderCommand(command);
  const isLocalQuery=formId!=='roomForm'&&formId!=='roomEmblemForm'&&query(command);
  if(reminderSetting!==null||isLocalQuery){
   event.preventDefault();event.stopImmediatePropagation();
   if(reminderSetting!==null)input.value='';
   queue=queue.then(()=>handle(command)).catch(err=>info('Error: '+err.message));
   return;
  }
  // Las salas mantienen el envio normal en rooms.js; se gestionan debajo.
  if(formId==='roomForm'||formId==='roomEmblemForm')return;
  // El submit nativo calcula, valida y guarda. Leemos el resultado después.
  setTimeout(()=>{
   const statusId=formId==='quickForm'?'quickStatus':formId==='form'?'status':'advancedStatus';
   const resultId=formId==='quickForm'?'quickResult':formId==='form'?'result':'advancedResult';
   const status=$(statusId),result=$(resultId);
   if(!status?.classList.contains('success')||result?.hidden)return;
   const heading=result.querySelector('strong')?.textContent||'';
   const ready=result.querySelector('.clock')?.textContent||'';
   if(!heading||!ready)return;
   const line=heading.replace(/^MID\b/,'medio')+' disponible al minuto '+ready;
   info('✅ '+heading+' · '+ready);
   queue=queue.then(()=>speak([line])).catch(err=>info('Error de voz: '+err.message));
  },0);
 },true);
});
// Salas: la voz responde al guardar incluso con micrófono apagado.
// No interceptamos los registros normales: rooms.js sigue controlando el guardado.
let voiceRoomSavePending=0;
window.addEventListener('wynee:room-saved',event=>{
 if(voiceRoomSavePending>0)return; // Un comando de micrófono ya responde en register().
 const record=event.detail?.record;
 if(!record||!Number.isFinite(Number(record.ready)))return;
 const label=(record.role?voiceRole(record.role)+' ':'')+(record.spell||'Hechizo');
 const line=label+' disponible al minuto '+spoken(Number(record.ready));
 info('✅ '+label+' · '+fmt(Number(record.ready)));
 queue=queue.then(()=>speak([line])).catch(err=>info('Error de voz: '+err.message));
});
// Consultas escritas y recordatorios en salas, sin alterar la captura de registros.
$('roomForm')?.addEventListener('submit',event=>{
 if(internalSubmit)return;
 const phrase=$('roomCommand')?.value?.trim();
 if(!phrase||!query(phrase))return;
 event.preventDefault();event.stopImmediatePropagation();
 queue=queue.then(()=>handle(phrase)).catch(err=>info('Error de voz: '+err.message));
},true);
// Las salas conservan su manejador de Firebase sin interceptores añadidos.
window.wyneeVoiceTest=async phrase=>handle(phrase);
})();