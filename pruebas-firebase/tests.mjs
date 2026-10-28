import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc, collection, setDoc, getDoc, getDocs, updateDoc, deleteDoc, writeBatch, serverTimestamp} from 'firebase/firestore';

const projectId='demo-wynee-local';
const rules=fs.readFileSync(new URL('./firestore.rules',import.meta.url),'utf8');
const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8087,rules}});
const A='owner123', B='player456', C='outsider789';
const roomId='a'.repeat(40), invite='b'.repeat(36);
const db=(uid)=>env.authenticatedContext(uid).firestore();
const room=(uid)=>doc(db(uid),'rooms',roomId);
const member=(uid,target)=>doc(db(uid),'rooms',roomId,'members',target);
const ban=(uid,target)=>doc(db(uid),'rooms',roomId,'bans',target);
let pass=0,fail=0;
async function test(name,fn){try{await fn(); console.log('  ✅ '+name);pass++;}catch(e){console.error('  ❌ '+name+' -> '+(e?.message||e));fail++;}}
try {
  await test('Crear sala + invitacion + integrante en lote',async()=>{
    const ownerDb=db(A);
    let batch=writeBatch(ownerDb);
    batch.set(doc(ownerDb,'rooms',roomId),{owner:A,mode:'quick',name:'Scrim',status:'active',createdAt:serverTimestamp()});
    batch.set(doc(ownerDb,'rooms',roomId,'members',A),{uid:A,nick:'Wynee',avatar:1,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()});
    batch.set(doc(ownerDb,'invites',invite),{roomId,owner:A,createdAt:serverTimestamp()});
    await assertSucceeds(batch.commit());
  });
  await test('Unirse con invitacion valida',()=>assertSucceeds(setDoc(member(B,B),{uid:B,nick:'RanyGod',avatar:2,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()})));
  await test('Otro usuario no puede borrar sala',()=>assertFails(deleteDoc(room(B))));
  await test('Otro usuario no puede bloquear',()=>assertFails(setDoc(ban(B,A),{uid:A,by:B,createdAt:serverTimestamp()})));
  await test('Anfitrion puede expulsar',()=>assertSucceeds(deleteDoc(member(A,B))));
  await test('Jugador expulsado puede volver',()=>assertSucceeds(setDoc(member(B,B),{uid:B,nick:'RanyGod',avatar:2,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()})));
  await test('Anfitrion bloquea y expulsa',async()=>{
    const ownerDb=db(A);const batch=writeBatch(ownerDb);batch.set(doc(ownerDb,'rooms',roomId,'bans',B),{uid:B,by:A,createdAt:serverTimestamp()});batch.delete(doc(ownerDb,'rooms',roomId,'members',B));await assertSucceeds(batch.commit());
  });
  await test('Bloqueado no puede volver',()=>assertFails(setDoc(member(B,B),{uid:B,nick:'RanyGod',avatar:2,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()})));
  await test('Anfitrion marca sala eliminada',()=>assertSucceeds(updateDoc(room(A),{status:'deleted'})));
  await test('No se puede unir a sala eliminada',()=>assertFails(setDoc(member(C,C),{uid:C,nick:'Jugador',avatar:1,inviteId:invite,joinedAt:serverTimestamp(),lastSeenAt:serverTimestamp()})));
  await test('Anfitrion borra sala marcada',()=>assertSucceeds(deleteDoc(room(A))));
} finally {await env.cleanup();}
console.log(`\nResultado: ${pass} correctas, ${fail} fallidas.`); if(fail)process.exitCode=1;
