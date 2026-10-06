(async()=>{
 const err=(t,m)=>{$.innerHTML=`<div class="card"><h2>${t}</h2><p class="m">${esc(m)}</p></div>`};
 if(!window.firebase){err("Firebase non caricato","Controlla la connessione a internet.");return}
 try{
  db=firebase.firestore();const a=firebase.auth();
  const u=a.currentUser||await new Promise(r=>{const off=a.onAuthStateChanged(x=>{off();r(x)})});
  uid=(u||(await a.signInAnonymously()).user).uid;
 }catch(e){err("Accesso non riuscito",(e.code||e.message)+" — in Firebase Console abilita Authentication > Sign-in method > Anonymous e aggiungi questo dominio tra i Domini autorizzati. Il gioco va aperto da http(s) o localhost, non da file://");return}
 await loadProfile();
 db.collection("rooms").onSnapshot(q=>{S.list=q.docs.map(d=>({id:d.id,...d.data()}));if(S.view==="lobby"&&!document.activeElement?.id)draw()},e=>{S.msg="Errore database: "+(e.code||e.message);draw()});
 if(S.profile){S.view="menu";const last=await vault.get("g4-room");if(last)return joinRoom(last)}
 draw();
})();
