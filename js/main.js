let roomsUnsub=null;
const err=(t,m)=>{$.innerHTML=`<div class="card"><h2>${t}</h2><p class="m">${esc(m)}</p></div>`};
async function bootUser(u){
 uid=u.uid;S.view="login";
 await loadProfile();
 if(roomsUnsub)roomsUnsub();
 roomsUnsub=db.collection("rooms").onSnapshot(q=>{S.list=q.docs.map(d=>({id:d.id,...d.data()}));if(S.view==="lobby"&&!document.activeElement?.id)draw()},e=>{S.msg="Errore database: "+(e.code||e.message);draw()});
 if(S.profile){S.view="menu";const last=await vault.get("g4-room");if(last)return joinRoom(last)}
 draw();
}
(async()=>{
 if(!window.firebase){err("Firebase non caricato","Controlla la connessione a internet.");return}
 try{
  db=firebase.firestore();const a=firebase.auth();
  try{await a.getRedirectResult()}catch(e){S.msg="Accesso Google non riuscito: "+(e.code||e.message)}
  const u=a.currentUser||await new Promise(r=>{const off=a.onAuthStateChanged(x=>{off();r(x)})});
  if(u)await bootUser(u);else draw();
 }catch(e){err("Avvio non riuscito",(e.code||e.message)+" — in Firebase Console abilita Authentication > Sign-in method > Google e aggiungi questo dominio tra i Domini autorizzati. Il gioco va aperto da http(s) o localhost, non da file://")}
})();
