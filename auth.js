import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,GoogleAuthProvider,signInWithPopup,signOut,sendPasswordResetEmail,updateProfile} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
const config={apiKey:'AIzaSyAI-r93-U_DQPxEYMJ8vFZZfhWTuOY9PUA',authDomain:'wynee-spell-tracker.firebaseapp.com',projectId:'wynee-spell-tracker',storageBucket:'wynee-spell-tracker.firebasestorage.app',messagingSenderId:'25752135452',appId:'1:25752135452:web:6abd48ba5f9a1e78077cd9',measurementId:'G-KLB028R4ZV'};
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),$=id=>document.getElementById(id);
const modal=$('wyneeAuthModal'),status=$('wyneeAuthStatus'),nick=$('wyneeAuthNick'),avatarRoot=$('wyneeAuthAvatars');
let avatar=1,active=null;
// El índice 1-based se conserva para los perfiles ya guardados.
const defaultAvatarFiles=Array.from({length:6},(_,i)=>`avatar-${i+1}.webp`);
let avatarFiles=[...defaultAvatarFiles];
function validAvatarFile(name){return typeof name==='string'&&/^[a-zA-Z0-9_-]+\.(?:webp|png|jpg|jpeg|gif|avif)$/.test(name)}
async function loadAvatarCatalog(){
  try{
    const response=await fetch('./avatars/avatars.json',{cache:'no-cache'});
    if(!response.ok)throw Error('Catálogo no disponible');
    const list=await response.json();
    if(!Array.isArray(list)||!list.length||list.length>200||!list.every(validAvatarFile))throw Error('Catálogo inválido');
    avatarFiles=list;
  }catch(error){console.warn('Wynee: se usarán los 6 avatares originales.',error)}
  render();
}
loadAvatarCatalog();
function message(s,error=false){status.textContent=s;status.style.color=error?'#ff829b':'#a5e5c4'}
function profileKey(u){return 'wynee-profile-'+u.uid}
function readProfile(u){try{return JSON.parse(localStorage.getItem(profileKey(u)))||{}}catch{return {}}}
function show(){modal.hidden=false;document.body.style.overflow='hidden';message('');render()}
function hide(){modal.hidden=true;document.body.style.overflow=''}
function render(){const u=auth.currentUser;active=u&&!u.isAnonymous?u:null;$('wyneeAuthLogin').hidden=!!active;$('wyneeAuthProfile').hidden=!active;$('wyneeAuthLogout').hidden=!active;const trigger=$('wyneeAuthTrigger');trigger.replaceChildren();if(active){const p=readProfile(active);const chosen=Number(p.avatar);const avatarIndex=Number.isInteger(chosen)&&chosen>=1&&chosen<=avatarFiles.length?chosen:1;const photo=document.createElement('img');photo.className='wynee-header-avatar';photo.src='./avatars/'+encodeURIComponent(avatarFiles[avatarIndex-1]);photo.alt='';photo.onerror=()=>{photo.style.display='none'};trigger.append(photo);trigger.setAttribute('aria-label','Abrir mi perfil');trigger.setAttribute('title','Mi perfil')}else {trigger.textContent='👤 Iniciar sesión';trigger.setAttribute('aria-label','Iniciar sesión');trigger.removeAttribute('title')}if(active){const p=readProfile(active);nick.value=p.nick||active.displayName||'';avatar=(Number(p.avatar)>0&&Number(p.avatar)<=avatarFiles.length)?Number(p.avatar):1;renderAvatars();$('wyneeAuthEmailLabel').textContent=active.email||'Cuenta Wynee'}}
function renderAvatars(){avatarRoot.replaceChildren();avatarFiles.forEach((file,index)=>{const i=index+1;const b=document.createElement('button');b.type='button';b.className='wynee-auth-avatar'+(i===avatar?' selected':'');b.setAttribute('aria-label','Avatar '+i);b.setAttribute('aria-pressed',String(i===avatar));const img=document.createElement('img');img.src='./avatars/'+encodeURIComponent(file);img.alt='Avatar '+i;b.append(img);b.addEventListener('click',()=>{avatar=i;renderAvatars()});avatarRoot.append(b)})}
function err(e){const codes={'auth/email-already-in-use':'Ese correo ya tiene una cuenta. Inicia sesión.','auth/invalid-email':'Correo electrónico inválido.','auth/invalid-credential':'Correo o contraseña incorrectos.','auth/weak-password':'La contraseña es demasiado débil.','auth/popup-closed-by-user':'Se cerró la ventana de Google.','auth/popup-blocked':'El navegador bloqueó la ventana emergente.','auth/operation-not-allowed':'Activa este proveedor en Firebase Authentication.','auth/unauthorized-domain':'Este dominio no está autorizado en Firebase.'};message(codes[e.code]||e.message||'Ocurrió un error.',true)}
async function run(fn){const buttons=modal.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);message('Procesando…');try{await fn();render();message('¡Listo!')}catch(e){err(e)}finally{buttons.forEach(b=>b.disabled=false)}}
$('wyneeAuthTrigger').addEventListener('click',show);$('wyneeAuthClose').addEventListener('click',hide);modal.addEventListener('click',e=>{if(e.target===modal)hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)hide()});
$('wyneeAuthRegister').addEventListener('click',()=>run(async()=>{const email=$('wyneeAuthEmail').value.trim(),password=$('wyneeAuthPassword').value;if(password.length<6)throw Error('Usa una contraseña de al menos 6 caracteres.');await createUserWithEmailAndPassword(auth,email,password)}));
$('wyneeAuthSignIn').addEventListener('click',()=>run(()=>signInWithEmailAndPassword(auth,$('wyneeAuthEmail').value.trim(),$('wyneeAuthPassword').value)));
$('wyneeAuthGoogle').addEventListener('click',()=>run(()=>signInWithPopup(auth,new GoogleAuthProvider())));
$('wyneeAuthReset').addEventListener('click',()=>run(async()=>{const email=$('wyneeAuthEmail').value.trim();if(!email)throw Error('Primero escribe tu correo electrónico.');await sendPasswordResetEmail(auth,email);message('Si la dirección tiene una cuenta, recibirás instrucciones para recuperar el acceso.')}));
$('wyneeAuthLogout').addEventListener('click',()=>run(()=>signOut(auth)));
$('wyneeAuthSaveProfile').addEventListener('click',()=>run(async()=>{const u=auth.currentUser;if(!u||u.isAnonymous)throw Error('Inicia sesión primero.');const name=nick.value.trim().replace(/\s+/g,' ');if(name.length<2||name.length>24)throw Error('El apodo debe tener de 2 a 24 caracteres.');await updateProfile(u,{displayName:name});localStorage.setItem(profileKey(u),JSON.stringify({nick:name,avatar}));const roomNick=$('roomNickname');if(roomNick)roomNick.value=name;try{localStorage.setItem('wynee-room-nick',name);localStorage.setItem('wynee-room-avatar',String(avatar))}catch{}window.dispatchEvent(new CustomEvent('wynee:profile-saved',{detail:{nick:name,avatar}}))}));
onAuthStateChanged(auth,u=>{render();if(u&&!u.isAnonymous){const p=readProfile(u),name=p.nick||u.displayName;if(name&&$('roomNickname'))$('roomNickname').value=name}});
