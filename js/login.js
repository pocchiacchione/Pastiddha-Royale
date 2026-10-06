// Profilo (login Firebase anonimo, vedi main.js) + cifratura locale AES-GCM
const $=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let db,uid;
const vault=(()=>{const te=new TextEncoder(),dec=new TextDecoder();
 const key=async()=>{const m=await crypto.subtle.importKey("raw",te.encode(uid),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:te.encode("g4"),iterations:100000,hash:"SHA-256"},m,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])};
 const b=u=>btoa(String.fromCharCode(...u)),ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 return{async set(k,v){try{if(v==null)return localStorage.removeItem(k);const iv=crypto.getRandomValues(new Uint8Array(12));const c=await crypto.subtle.encrypt({name:"AES-GCM",iv},await key(),te.encode(JSON.stringify(v)));localStorage.setItem(k,b(iv)+"."+b(new Uint8Array(c)))}catch(e){}},
 async get(k){try{const[i,c]=localStorage.getItem(k).split(".");return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:ub(i)},await key(),ub(c))))}catch(e){return null}}}})();
const prof=()=>db.collection("users").doc(uid);
const tmo=(p,ms=8000)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j({code:"timeout",message:"nessuna risposta da Firestore"}),ms))]);
async function loadProfile(){try{const s=await tmo(prof().get());S.profile=s.exists?s.data():null}catch(e){S.profile=null;S.msg="Database non raggiungibile: "+(e.code||e.message)}}
async function saveProfile(){const n=document.getElementById("un").value.trim().slice(0,30);if(!n){alert("Inserisci un nome utente");return}
 const b=document.querySelector("#app button");if(b)b.disabled=true;
 try{await tmo(prof().set({username:n}));S.profile={username:n};S.msg="";S.view="menu";draw()}
 catch(e){if(b)b.disabled=false;alert("Salvataggio profilo non riuscito: "+(e.code||e.message)+"\n\nControlla in Firebase Console: 1) Firestore Database creato, 2) regole pubblicate (firestore.rules).")}}
async function googleLogin(){
 const a=firebase.auth(),pr=new firebase.auth.GoogleAuthProvider();S.msg="Accesso in corso…";draw();
 try{const r=await a.signInWithPopup(pr);S.msg="";await bootUser(r.user)}
 catch(e){
  if(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment"){try{await a.signInWithRedirect(pr);return}catch(e2){e=e2}}
  S.msg=(e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request")?"":"Accesso Google non riuscito: "+(e.code||e.message);draw()}}
async function signOutG(){await vault.set("g4-room",null);leave();if(roomsUnsub){roomsUnsub();roomsUnsub=null}
 try{await firebase.auth().signOut()}catch(e){}
 uid=null;S.profile=null;S.list=[];S.msg="";S.view="login";draw()}
async function logout(){await vault.set("g4-room",null);leave();S.view="login";draw()} // cambia nome (l'utente Firebase resta lo stesso)
