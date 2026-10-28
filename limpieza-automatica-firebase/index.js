// Wynee v1.8: trabajo del servidor, NO se ejecuta desde el navegador.
// Requiere Firebase Blaze y desplegar Cloud Functions.
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, Timestamp} = require('firebase-admin/firestore');
initializeApp();
const db = getFirestore();
const EMPTY_LIMIT_MS = 12 * 60 * 1000;
const OFFLINE_AFTER_MS = 90 * 1000;
const MAX_ROOMS_PER_RUN = 200;

async function deleteInvitesForRoom(roomId) {
  const snap=await db.collection('invites').where('roomId','==',roomId).get();
  for(let i=0;i<snap.docs.length;i+=200){
    const batch=db.batch();snap.docs.slice(i,i+200).forEach(d=>batch.delete(d.ref));await batch.commit();
  }
}
async function reviewRoom(roomRef,nowMs) {
  const cutoff=Timestamp.fromMillis(nowMs-OFFLINE_AFTER_MS);
  // Transacción: verifica actividad y actualiza el estado de forma coherente.
  const decision=await db.runTransaction(async tx=>{
    const room=await tx.get(roomRef);
    if(!room.exists || room.data().status!=='active')return 'skip';
    const recent=await tx.get(roomRef.collection('members').where('lastSeenAt','>',cutoff).limit(1));
    const online= !recent.empty;
    const emptySince=room.data().emptySince;
    if(online){
      if(emptySince)tx.update(roomRef,{emptySince:require('firebase-admin/firestore').FieldValue.delete()});
      return 'active';
    }
    if(!emptySince){tx.update(roomRef,{emptySince:Timestamp.fromMillis(nowMs)});return 'marked-empty'}
    if(nowMs-emptySince.toMillis() < EMPTY_LIMIT_MS)return 'waiting';
    tx.update(roomRef,{status:'deleted'});return 'delete';
  });
  if(decision!=='delete')return decision;
  // No borrar desde el cliente: Admin SDK limpia registros y códigos incluso de salas antiguas.
  // Si se interrumpe, el estado deleted permite reintentar en la siguiente ejecución.
  await cleanupDeletedRoom(roomRef);
  return 'deleted';
}
async function cleanupDeletedRoom(roomRef){
  await deleteInvitesForRoom(roomRef.id);
  await db.recursiveDelete(roomRef); // Incluye members, records, bans y futuras subcolecciones.
}
exports.wyneeLimpiezaSalas = onSchedule({
  schedule:'every 1 minutes',timeZone:'Etc/UTC',region:'us-central1',
  maxInstances:1,timeoutSeconds:300,memory:'256MiB'
},async()=>{
  const nowMs=Date.now();
  let cursor=null;
  for(let page=0;page<25;page++){
    let q=db.collection('rooms').orderBy('__name__').limit(MAX_ROOMS_PER_RUN);
    if(cursor)q=q.startAfter(cursor);
    const snaps=await q.get();
    if(snaps.empty)break;
    cursor=snaps.docs[snaps.docs.length-1];
    for(const room of snaps.docs){
      try{
        if(room.data().status==='deleted')await cleanupDeletedRoom(room.ref);
        else await reviewRoom(room.ref,nowMs);
      }catch(err){console.error('No se pudo revisar',room.id,err)}
    }
    if(snaps.size<MAX_ROOMS_PER_RUN)break;
  }
});
