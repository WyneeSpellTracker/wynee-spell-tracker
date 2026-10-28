import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth, signInAnonymously, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore, doc, collection, getDoc, writeBatch, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, getDocs} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
const config={apiKey:'AIzaSyAI-r93-U_DQPxEYMJ8vFZZfhWTuOY9PUA',authDomain:'wynee-spell-tracker.firebaseapp.com',projectId:'wynee-spell-tracker',storageBucket:'wynee-spell-tracker.firebasestorage.app',messagingSenderId:'25752135452',appId:'1:25752135452:web:6abd48ba5f9a1e78077cd9',measurementId:'G-KLB028R4ZV'};
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id), roles={exp:'EXP',xp:'EXP',mid:'MID',medio:'MID',mago:'MID',jg:'JUNGLA',jungla:'JUNGLA',roam:'ROAM',roamer:'ROAM',tanque:'ROAM',support:'ROAM',sup:'ROAM',mm:'ORO',oro:'ORO',adc:'ORO',tirador:'ORO'};
const defs=[['Parpadeo',120,['f','p','flicker','parpadeo']],['Retribución',35,['r','retri','retribucion','retribution']],['Aegis',75,['a','aegis']],['Inspirar',75,['i','inspirar','inspire']],['Venganza',75,['v','venganza','vengeance']],['Petrificar',60,['petri','petrificar','petrify']],['Revitalizar',60,['re','revitalizar','revitalize']],['Purificar',90,['puri','purificar','purify']],['Sprint',100,['s','sprint']],['Flameshot',50,['flameshot','flame']]];
const spells={};for(const [name,cd,aliases] of defs)for(const a of aliases)spells[a]=[name,cd];
const modeNames={quick:'RÁPIDO',tactical:'ESTÁNDAR'};
const state={uid:null,roomId:null,invite:null,mode:null,records:[],members:new Map(),unsubscribe:[],avatar:1,owner:null,heartbeat:null,presenceRefresh:null,leaving:false,deleting:false,expiresAt:null};
function notify(message,error=false){
  $('roomStatus').textContent=message;
  $('roomStatus').className=error?'error':'success';
  const alert=$('roomEntryAlert');
  if(!$('roomEntry').hidden){
    alert.textContent=message;
    alert.className='room-entry-alert'+(error?'':' success');
    alert.hidden=!message;
  }
}
function updateRoomEntryAccess(){
  const u=auth.currentUser,alert=$('roomEntryAlert');
  if(!u||u.isAnonymous){
    alert.textContent='Inicia sesión con tu cuenta Wynee desde el encabezado para crear o unirte a una sala.';
    alert.className='room-entry-alert';alert.hidden=false;
  }else if(alert.textContent.includes('Inicia sesión')){
    alert.textContent='';alert.hidden=true;
  }
}
// Spark: vigencia lógica de 12 minutos renovada mientras haya integrantes activos.
// No implica eliminación física inmediata: la limpieza la realiza el anfitrión cuando vuelve.
const ROOM_IDLE_MS=12*60*1000;
const OWNED_KEY='wynee-owned-rooms-v19';
function expiration(){return Timestamp.fromMillis(Date.now()+ROOM_IDLE_MS)}
function expired(data){return !!(data?.expiresAt?.toMillis&&data.expiresAt.toMillis()<=Date.now())}
function rememberOwned(roomId,invite){
  try{const list=JSON.parse(localStorage.getItem(OWNED_KEY)||'[]');
    const keep=list.filter(x=>x.roomId!==roomId);keep.push({roomId,invite});
    localStorage.setItem(OWNED_KEY,JSON.stringify(keep.slice(-100)));}catch{}
}
function forgetOwned(roomId){try{const list=JSON.parse(localStorage.getItem(OWNED_KEY)||'[]');localStorage.setItem(OWNED_KEY,JSON.stringify(list.filter(x=>x.roomId!==roomId)))}catch{}}
async function cleanExpiredOwned(){
  const uid=auth.currentUser?.uid;if(!uid||auth.currentUser?.isAnonymous)return;
  let list=[];try{list=JSON.parse(localStorage.getItem(OWNED_KEY)||'[]')}catch{return}
  for(const item of list){
    try{const snapshot=await getDoc(doc(db,'rooms',item.roomId));
      if(!snapshot.exists()){forgetOwned(item.roomId);continue}
      const room=snapshot.data();
      if(room.owner!==uid){forgetOwned(item.roomId);continue}
      if(!expired(room)&&room.status!=='deleted')continue;
      if(room.status!=='deleted')await updateDoc(doc(db,'rooms',item.roomId),{status:'deleted'});
      for(const sub of ['records','members','bans']){
        // Releer cada lote, para no omitir documentos que cambien durante la operación.
        for(let attempt=0;attempt<30;attempt++){
          const docs=await getDocs(collection(db,'rooms',item.roomId,sub));
          if(docs.empty)break;
          const batch=writeBatch(db);
          for(const d of docs.docs.slice(0,200))batch.delete(d.ref);
          await batch.commit();
          if(docs.size<=200)break;
        }
      }
      if(item.invite)await deleteDoc(doc(db,'invites',item.invite));
      await deleteDoc(doc(db,'rooms',item.roomId));forgetOwned(item.roomId);
    }catch(e){console.warn('Limpieza pendiente de sala caducada:',item.roomId,e)}
  }
}
function rand(bytes=18){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')}
function fmt(n){return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
function parse(input,withRole){const s=input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().split(/\s+/);if(s.length!==(withRole?3:2))throw Error(withRole?'Usa: exp f 455':'Usa: f 455');const [r,a,t]=withRole?s:[null,...s];if(withRole&&!roles[r])throw Error('Rol inválido. Usa exp, mid, jg, roam u oro.');if(!spells[a])throw Error('Hechizo desconocido.');if(!/^\d{2,5}$/.test(t)||Number(t.slice(-2))>59)throw Error('Tiempo inválido. Ejemplo: 455.');const used=Number(t.slice(0,-2))*60+Number(t.slice(-2));if(used>59999)throw Error('Tiempo demasiado alto.');return{role:withRole?roles[r]:'',spell:spells[a][0],cd:spells[a][1],used}}
function accountProfile(){
  const u=auth.currentUser;
  if(!u||u.isAnonymous)throw Error('Inicia sesión con tu cuenta Wynee para usar salas compartidas.');
  let saved={};try{saved=JSON.parse(localStorage.getItem('wynee-profile-'+u.uid))||{}}catch{}
  const nick=String(saved.nick||u.displayName||'').trim().replace(/\s+/g,' ');
  const avatar=Number(saved.avatar)||1;
  if(nick.length<2||nick.length>24)throw Error('Abre Mi cuenta y guarda primero un apodo de 2 a 24 caracteres.');
  return {nick,avatar:avatar>=1&&avatar<=6?avatar:1};
}
function profile(){return accountProfile()}
function syncAccountProfile(){
  const u=auth.currentUser;if(!u||u.isAnonymous)return;
  try{const p=accountProfile();state.avatar=p.avatar;$('roomNickname').value=p.nick;$('roomNicknameInRoom').value=p.nick;avatarPicker()}catch{}
}
window.addEventListener('wynee:profile-saved',syncAccountProfile);
onAuthStateChanged(auth,()=>{syncAccountProfile();updateRoomEntryAccess();cleanExpiredOwned();});
function avatarImg(n){const img=document.createElement('img');img.src=`avatars/avatar-${n}.webp`;img.alt='';img.className='room-avatar';return img}
function avatarPicker(){const targets=[$('avatarPicker'),$('avatarPickerInRoom')];for(const target of targets){target.replaceChildren();for(let i=1;i<=6;i++){const b=document.createElement('button');b.type='button';b.className='avatar-option'+(i===state.avatar?' selected':'');b.setAttribute('aria-label','Elegir avatar '+i);b.setAttribute('aria-pressed',String(i===state.avatar));b.append(avatarImg(i));b.addEventListener('click',()=>{state.avatar=i;try{localStorage.setItem('wynee-room-avatar',String(i))}catch{}avatarPicker()});target.append(b)}}}
try{const a=Number(localStorage.getItem('wynee-room-avatar'));if(a>=1&&a<=6)state.avatar=a;const n=localStorage.getItem('wynee-room-nick');if(n)$('roomNickname').value=n}catch{}
avatarPicker();
function showRoom(){document.getElementById('lobbyPage').hidden=true;document.getElementById('calculatorPage').hidden=true;$('roomPage').hidden=false;window.scrollTo(0,0)}
function stop(){
  if(state.heartbeat)clearInterval(state.heartbeat);
  if(state.presenceRefresh)clearInterval(state.presenceRefresh);
  state.heartbeat=null;state.presenceRefresh=null;
  for(const f of state.unsubscribe)f();state.unsubscribe=[];state.members.clear();state.records=[];
}
function returnToLobby(message){stop();state.roomId=null;state.invite=null;state.mode=null;state.owner=null;state.expiresAt=null;
  $('roomWorkspace').hidden=true;$('roomFarewell').hidden=true;$('roomEntry').hidden=false;$('roomPage').hidden=true;
  document.getElementById('lobbyPage').hidden=false;window.scrollTo(0,0);
  if(message)notify(message,true);
}
function showRoomFarewell(){
  stop();state.roomId=null;state.invite=null;state.mode=null;state.owner=null;state.expiresAt=null;
  state.deleting=false;state.leaving=false;
  $('roomWorkspace').hidden=true;$('roomEntry').hidden=true;$('roomFarewell').hidden=false;
  $('roomPage').hidden=false;window.scrollTo(0,0);
}
$('roomFarewellBack').addEventListener('click',()=>{
  $('roomFarewell').hidden=true;$('roomPage').hidden=true;
  $('roomEntry').hidden=false;
  document.getElementById('lobbyPage').hidden=false;
  document.getElementById('wyneeExperience').hidden=false;
  document.getElementById('wyneeIndividualHome').hidden=true;
  document.getElementById('trackerPage').hidden=false;
  window.scrollTo(0,0);
});
async function leave(){
  if(state.leaving)return;state.leaving=true;
  const id=state.roomId,uid=auth.currentUser?.uid;
  // La salida voluntaria elimina la membresía; el historial permanece.
  try{if(id&&uid)await deleteDoc(doc(db,'rooms',id,'members',uid))}
  catch(e){fail(e);state.leaving=false;return}
  returnToLobby();state.leaving=false;
}
const online=m=>m.lastSeenAt?.toMillis && Date.now()-m.lastSeenAt.toMillis()<90000;
async function heartbeat(){
  if(!state.roomId||state.leaving||!auth.currentUser)return;
  const room=state.roomId;
  try{
    const batch=writeBatch(db);
    batch.update(doc(db,'rooms',room,'members',auth.currentUser.uid),{lastSeenAt:serverTimestamp()});
    batch.update(doc(db,'rooms',room),{expiresAt:expiration()});
    await batch.commit();
  }
  catch(e){if(state.roomId===room)console.warn('Presencia no actualizada',e)}
}
function kickedOut(message){if(!state.roomId||state.leaving||state.deleting)return;returnToLobby(message||'Ya no perteneces a esta sala.')}

$('openRooms').addEventListener('click',()=>{showRoom();notify('')});$('roomBack').addEventListener('click',leave);$('roomLeave').addEventListener('click',leave);
async function authReady(){
  if(auth.authStateReady)await auth.authStateReady();
  const u=auth.currentUser;
  if(!u||u.isAnonymous)throw Error('Inicia sesión en Mi cuenta para crear o unirte a una sala.');
  return u;
}
function remember(p){try{localStorage.setItem('wynee-room-nick',p.nick)}catch{}}
function fail(e){console.error('Wynee rooms:',e);notify(e?.code==='permission-denied'?'Firebase rechazó la operación. Revisa que publicaste las reglas incluidas en este ZIP y que iniciaste sesión con tu cuenta Wynee.':e?.message||'Error de conexión.',true)}
function busy(v){for(const id of ['createRoom','joinRoom'])$(id).disabled=v}
$('createRoom').addEventListener('click',async()=>{busy(true);try{const p=profile();remember(p);const u=await authReady(),roomId=rand(20),invite=rand(18),mode=$('roomMode').value,roomName=$('roomName').value.trim().replace(/\s+/g,' ');if(roomName.length<2||roomName.length>40)throw Error('El nombre de la sala debe tener entre 2 y 40 caracteres.');const batch=writeBatch(db);batch.set(doc(db,'rooms',roomId),{owner:u.uid,mode,name:roomName,status:'active',createdAt:serverTimestamp(),expiresAt:expiration()});batch.set(doc(db,'rooms',roomId,'members',u.uid),{uid:u.uid,nick:p.nick,avatar:p.avatar,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()});batch.set(doc(db,'invites',invite),{roomId,owner:u.uid,createdAt:serverTimestamp()});await batch.commit();rememberOwned(roomId,invite);await enter(roomId,invite,mode,roomName)}catch(e){fail(e)}finally{busy(false)}});
$('joinRoom').addEventListener('click',async()=>{busy(true);try{const p=profile();remember(p);const u=await authReady();const invite=$('roomInvite').value.trim().toLowerCase();if(!/^[a-f0-9]{36}$/.test(invite))throw Error('Código de invitación inválido. Copia el código completo.');const snap=await getDoc(doc(db,'invites',invite));if(!snap.exists())throw Error('No existe una sala con ese código.');const roomId=snap.data().roomId;const member=doc(db,'rooms',roomId,'members',u.uid);const existing=await getDoc(member);if(existing.exists())await updateDoc(member,{...p,lastSeenAt:serverTimestamp()});else await setDoc(member,{uid:u.uid,nick:p.nick,avatar:p.avatar,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()});const room=await getDoc(doc(db,'rooms',roomId));if(!room.exists()||room.data().status==='deleted'||expired(room.data()))throw Error('La sala ya no está disponible: caducó por inactividad.');await enter(roomId,invite,room.data().mode,room.data().name||'Sala compartida')}catch(e){fail(e)}finally{busy(false)}});
async function enter(roomId,invite,mode,roomName){stop();state.roomId=roomId;state.invite=invite;state.mode=mode;state.leaving=false;$('roomEntry').hidden=true;$('roomWorkspace').hidden=false;$('roomNicknameInRoom').value=accountProfile().nick;$('roomTitle').textContent=(roomName||'SALA')+' · '+(modeNames[mode]||'ESTÁNDAR');$('roomStandardTabs').hidden=mode!=='tactical';switchRoomTab('records');$('roomCode').value=invite;$('roomCommand').placeholder=mode==='quick'?'Ej. f 455':'Ej. exp f 455';$('roomAdvancedStats').hidden=true;$('roomBoard').hidden=mode!=='tactical';$('roomEntries').replaceChildren();notify('Conectado. Esperando registros…');state.unsubscribe.push(onSnapshot(doc(db,'rooms',roomId),snap=>{
  if(state.deleting)return;
  if(!snap.exists()||snap.data().status==='deleted'||expired(snap.data())){if(state.owner!==auth.currentUser?.uid||!document.getElementById('roomDelete').disabled)kickedOut('La sala fue eliminada o caducó tras 12 minutos sin conexión.');return}
  state.owner=snap.data().owner;state.expiresAt=snap.data().expiresAt||null;
  $('roomHostControls').hidden=state.owner!==auth.currentUser?.uid;
  renderMembers();
},e=>{console.warn('Sala sin acceso',e);kickedOut('Se perdió el acceso a la sala.')}));
state.unsubscribe.push(onSnapshot(doc(db,'rooms',roomId,'members',auth.currentUser.uid),snap=>{
  if(!snap.exists())kickedOut('Saliste de la sala o el anfitrión te expulsó.');
},e=>{console.warn('Membresía sin acceso',e);kickedOut('Ya no tienes acceso a esta sala.')}));
state.unsubscribe.push(onSnapshot(collection(db,'rooms',roomId,'members'),snap=>{
  state.members=new Map(snap.docs.map(d=>[d.id,d.data()]));renderMembers();renderRecords()
},fail));
state.heartbeat=setInterval(heartbeat,30000);
state.presenceRefresh=setInterval(()=>{
  renderMembers();
  if(state.expiresAt?.toMillis&&Date.now()>=state.expiresAt.toMillis())
    kickedOut('La sala caducó tras 12 minutos sin conexión.');
},10000);
heartbeat();state.unsubscribe.push(onSnapshot(query(collection(db,'rooms',roomId,'records'),orderBy('createdAt','desc')),snap=>{state.records=snap.docs.map(d=>({id:d.id,...d.data()}));window.dispatchEvent(new CustomEvent('wynee:room-records',{detail:{roomId:state.roomId,records:state.records}}));renderRecords();notify('Sala sincronizada en tiempo real.')},fail));}
$('copyRoomCode').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.invite);notify('Código copiado. Compártelo solamente con tu equipo.')}catch{const el=$('roomCode');el.select();notify('Selecciona el código y cópialo manualmente.')}});
$('saveRoomProfile').addEventListener('click',async()=>{try{if(!state.roomId)throw Error('Entra primero a una sala.');const nick=$('roomNicknameInRoom').value.trim().replace(/\s+/g,' ');if(nick.length<2||nick.length>24)throw Error('El apodo debe tener de 2 a 24 caracteres.');const p={nick,avatar:state.avatar};await updateDoc(doc(db,'rooms',state.roomId,'members',auth.currentUser.uid),p);$('roomNickname').value=nick;remember(p);notify('Perfil actualizado para todos los integrantes.')}catch(e){fail(e)}});
function renderMembers(){
  const root=$('roomMembers');root.replaceChildren();
  const all=[...state.members].sort((a,b)=>Number(online(b[1]))-Number(online(a[1])));
  for(const [uid,m] of all){
    const item=document.createElement('span');item.className='member-chip';
    if(!online(m))item.classList.add('room-offline');
    item.append(avatarImg(m.avatar));
    const t=document.createElement('span');t.textContent=m.nick+(uid===auth.currentUser?.uid?' (tú)':'')+(online(m)?'':' · desconectado');item.append(t);
    if(state.owner===auth.currentUser?.uid&&uid!==auth.currentUser?.uid){
      const kick=textNode('button','Expulsar','secondary small-btn');kick.type='button';kick.title='Puede volver con el código';
      kick.onclick=()=>moderate(uid,m.nick,false);item.append(kick);
      const ban=textNode('button','Bloquear','danger small-btn');ban.type='button';
      ban.onclick=()=>moderate(uid,m.nick,true);item.append(ban);
    }
    root.append(item);
  }
  const count=all.filter(([,m])=>online(m)).length;
  $('roomOnlineCount').textContent=`${count} conectado${count===1?'':'s'} · ${all.length} registrado${all.length===1?'':'s'}`;
}
async function moderate(uid,nick,ban){
 if(!state.roomId||state.owner!==auth.currentUser?.uid)return;
 if(!confirm(`¿${ban?'Bloquear':'Expulsar'} a ${nick}? ${ban?'No podrá volver usando el código.':'Podrá volver a entrar.'}`))return;
 try{
   const batch=writeBatch(db);
   if(ban)batch.set(doc(db,'rooms',state.roomId,'bans',uid),{uid,by:state.owner,createdAt:serverTimestamp()});
   batch.delete(doc(db,'rooms',state.roomId,'members',uid));
   await batch.commit();notify(`${nick}: ${ban?'bloqueado':'expulsado'} correctamente.`);
 }catch(e){fail(e)}
}
$('roomDelete').addEventListener('click',async()=>{
 const roomId=state.roomId;const inviteCode=state.invite;
 if(!roomId||state.owner!==auth.currentUser?.uid)return;
 if(!window.confirm('¿Quieres eliminar la sala? Se eliminará para todos los integrantes y se perderán sus registros.'))return;
 const b=$('roomDelete');b.disabled=true;state.deleting=true;
 try{
   // Marcar primero: los oyentes salen y ningún invitado nuevo puede incorporarse.
   const currentRoom=await getDoc(doc(db,'rooms',roomId));
   if(!currentRoom.exists())throw Error('La sala ya fue eliminada.');
   if(currentRoom.data().status!=='deleted')await updateDoc(doc(db,'rooms',roomId),{status:'deleted'});
   const {getDocs}=await import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js');
   for(const sub of ['records','members','bans']){
     const documents=await getDocs(collection(db,'rooms',roomId,sub));
     for(let i=0;i<documents.docs.length;i+=200){
       const batch=writeBatch(db);
       for(const d of documents.docs.slice(i,i+200))batch.delete(d.ref);
       await batch.commit();
     }
   }
   await deleteDoc(doc(db,'invites',inviteCode));
   await deleteDoc(doc(db,'rooms',roomId));
   forgetOwned(roomId);showRoomFarewell();
 }catch(e){state.deleting=false;fail(e);notify('La eliminación no terminó. Puedes pulsar otra vez «Eliminar sala» para reintentar.',true)}
 finally{b.disabled=false}
});
function textNode(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function renderRecords(){const root=$('roomEntries');root.replaceChildren();const max=state.mode==='tactical'?500:3;const items=state.records.slice(0,max);if(!items.length)root.append(textNode('p','Aún no hay hechizos registrados.','empty'));for(const x of items){const item=document.createElement('article');item.className='room-record';const who=state.members.get(x.author);const left=document.createElement('div');left.className='record-detail';left.append(avatarImg(who?.avatar||1));const content=document.createElement('div');content.append(textNode('strong',(x.role?x.role+' · ':'')+x.spell));content.append(textNode('p',`${who?.nick||'Jugador'} · usado ${fmt(x.used)}${x.reduction!=null?' · '+x.reduction+' % ('+x.kills+' K / '+x.assists+' A)':''}`,'tiny'));left.append(content);item.append(left,textNode('strong',fmt(x.ready),'clock'));const actions=document.createElement('div');actions.className='record-actions';const edit=textNode('button','Editar','secondary small-btn');edit.type='button';edit.addEventListener('click',()=>editRecord(x));const del=textNode('button','×','danger small-btn');del.type='button';del.setAttribute('aria-label','Eliminar registro');del.addEventListener('click',()=>removeRecord(x));actions.append(edit,del);item.append(actions);root.append(item)}if(state.mode==='tactical'){const board=$('roomBoard');board.replaceChildren();for(const role of ['EXP','MID','JUNGLA','ROAM','ORO']){const last=state.records.find(x=>x.role===role);const card=document.createElement('article');card.className='role';card.append(textNode('h3',role),textNode('div',last?fmt(last.ready):'—:—','clock'),textNode('p',last?last.spell:'Sin registros','tiny'));board.append(card)}}}
function calculate(raw){const x=parse(raw,state.mode!=='quick');let reduction=null,kills=null,assists=null;return {...x,ready:x.used+Math.ceil(x.cd*(100-(reduction||0))/100),reduction,kills,assists}}
// Reinicia los hechizos compartidos, sin borrar la sala, los miembros ni la invitación.
// Firestore limita el tamaño de los lotes; usar 200 operaciones por lote.
$('roomResetMatch').addEventListener('click',async()=>{
  if(!state.roomId)return notify('Entra primero a una sala.',true);
  const roomId=state.roomId;
  const count=state.records.length;
  if(!count)return notify('La sala ya está sin registros.');
  if(!confirm(`¿Reiniciar partida? Se borrarán ${count} registro(s) para TODOS los integrantes. El código y los jugadores se conservarán.`))return;
  const button=$('roomResetMatch');button.disabled=true;
  try{
    // Evita enviar demasiadas eliminaciones en una sola operación.
    const ids=state.records.map(x=>x.id);
    let removed=0;
    for(let i=0;i<ids.length;i+=200){
      if(state.roomId!==roomId)throw Error('Saliste de la sala antes de terminar el reinicio.');
      const batch=writeBatch(db);
      for(const id of ids.slice(i,i+200))batch.delete(doc(db,'rooms',roomId,'records',id));
      await batch.commit();
      removed+=Math.min(200,ids.length-i);
    }
    notify(`Partida reiniciada: ${removed} registros eliminados para todos.`);
  }catch(e){fail(e)}finally{button.disabled=false}
});
$('roomForm').addEventListener('submit',async e=>{e.preventDefault();try{if(!state.roomId)throw Error('No hay sala activa.');const x=calculate($('roomCommand').value);await addDoc(collection(db,'rooms',state.roomId,'records'),{...x,author:auth.currentUser.uid,createdAt:serverTimestamp()});$('roomCommand').value='';window.dispatchEvent(new CustomEvent('wynee:room-saved',{detail:{record:x}}));notify('Hechizo compartido con la sala.');$('roomCommand').focus()}catch(err){window.dispatchEvent(new CustomEvent('wynee:room-save-error',{detail:{message:err.message}}));fail(err)}});
async function editRecord(x){const command=prompt('Nuevo comando (ej. '+(state.mode==='quick'?'f 455':'exp f 455')+'):',(x.role?x.role.toLowerCase()+' ':'')+'f '+fmt(x.used).replace(':',''));if(command===null)return;try{const y=calculate(command);await updateDoc(doc(db,'rooms',state.roomId,'records',x.id),{...y,editedAt:serverTimestamp()});notify('Registro actualizado.')}catch(e){fail(e)}}
async function removeRecord(x){if(!confirm('¿Eliminar este registro para todos los integrantes?'))return;try{await deleteDoc(doc(db,'rooms',state.roomId,'records',x.id));notify('Registro eliminado.')}catch(e){fail(e)}}
onAuthStateChanged(auth,u=>{state.uid=u?.uid||null});
const fromUrl=new URLSearchParams(location.search).get('sala');if(fromUrl&&/^[a-f0-9]{36}$/.test(fromUrl)){$('roomInvite').value=fromUrl;showRoom()}

// En Estándar, Emblema es una herramienta dentro de la sala, no un tercer modo.
function switchRoomTab(tab){
  const emblem=tab==='emblem';
  $('roomRecordsPanel').hidden=emblem; $('roomEmblemPanel').hidden=!emblem;
  $('roomTabRecords').classList.toggle('active',!emblem);
  $('roomTabEmblem').classList.toggle('active',emblem);
}
$('roomTabRecords').addEventListener('click',()=>switchRoomTab('records'));
$('roomTabEmblem').addEventListener('click',()=>switchRoomTab('emblem'));
function roomEmblemStats(){
  const kills=Number($('roomEmblemKills').value),assists=Number($('roomEmblemAssists').value);
  if(!Number.isInteger(kills)||!Number.isInteger(assists)||kills<0||assists<0||kills>999||assists>999)throw Error('Kills y asistencias deben estar entre 0 y 999.');
  const stacks=Math.min(8,kills+assists);
  return {kills,assists,stacks,reduction:12+stacks};
}
function updateRoomEmblemPreview(){
  try{
    const {stacks,reduction}=roomEmblemStats();
    $('roomEmblemPercent').textContent=reduction+' %';
    $('roomEmblemStackText').textContent=`12 % base + ${stacks} % extra (${stacks}/8 acumulaciones)`;
    const root=$('roomEmblemBars');root.replaceChildren();
    for(let i=0;i<8;i++){const bar=document.createElement('span');if(i<stacks)bar.className='active';root.append(bar)}
  }catch(e){$('roomEmblemStackText').textContent=e.message;}
}
for(const id of ['roomEmblemKills','roomEmblemAssists'])$(id).addEventListener('input',updateRoomEmblemPreview);
document.querySelectorAll('[data-room-counter]').forEach(button=>button.addEventListener('click',()=>{
  const target=$(button.dataset.roomCounter);
  target.value=String(Math.max(0,Math.min(999,(Number(target.value)||0)+Number(button.dataset.step))));
  updateRoomEmblemPreview();
}));
$('roomEmblemForm').addEventListener('submit',e=>{
  e.preventDefault();
  try{
    const x=parse($('roomEmblemCommand').value,true);
    const {kills,assists,reduction}=roomEmblemStats();
    const effective=Math.ceil(x.cd*(100-reduction)/100);
    $('roomEmblemResult').textContent=`${x.role} · ${x.spell}: ${reduction} % de reducción · cooldown ${effective} s (base ${x.cd} s). Usado ${fmt(x.used)} · disponible ${fmt(x.used+effective)} · ${kills} K / ${assists} A.`;
  }catch(error){$('roomEmblemResult').textContent=error.message;}
});
updateRoomEmblemPreview();
