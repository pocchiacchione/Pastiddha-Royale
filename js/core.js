// Stato, sottoscrizioni DB, stanze
const S={view:"login",code:null,room:null,players:{},tiles:[],atks:[],rels:{},reqs:[],confs:{},list:[],sel:null,atk:null,modal:null,msg:"",subs:[],left:TURN,profile:null,tick:null};
S.tiles=Array.from({length:NT},()=>({}));
const rc=()=>db.collection("rooms").doc(S.code),pd=id=>rc().collection("players").doc(id),tdoc=i=>rc().collection("tiles").doc("t"+i);
const P=()=>S.players[uid];
const tilesOf=id=>S.tiles.map((t,i)=>t.owner===id?i:-1).filter(i=>i>=0);
const col=id=>COL[Math.abs([...id].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7))%16];
const nm=id=>S.players[id]?.nation||S.players[id]?.user||"?";
const myConf=()=>{const c=P()?.conf;return c&&S.confs[c]?{id:c,...S.confs[c]}:null};
const sameConf=(a,b)=>{const x=S.players[a]?.conf;return !!x&&x===S.players[b]?.conf};
function unsub(){S.subs.forEach(f=>f());S.subs=[];clearInterval(S.tick)}
function enter(c){
 unsub();S.code=c;S.view="room";vault.set("g4-room",c);S.players={};S.tiles=Array.from({length:NT},()=>({}));S.atks=[];S.rels={};S.reqs=[];S.confs={};
 const fail=e=>{S.msg="Errore database: "+(e.code||e.message);draw()};
 const col_=(n,fn)=>S.subs.push(rc().collection(n).onSnapshot(q=>{fn(q.docs);draw()},fail));
 S.subs.push(rc().onSnapshot(s=>{S.room=s.exists?s.data():null;if(!S.room)leave();else draw()},fail));
 col_("players",ds=>{S.players={};ds.forEach(d=>S.players[d.id]=d.data())});
 col_("tiles",ds=>{S.tiles=Array.from({length:NT},()=>({}));ds.forEach(d=>{S.tiles[+d.id.slice(1)]=d.data()})});
 col_("attacks",ds=>{S.atks=ds.map(d=>({id:d.id,...d.data()}))});
 col_("rels",ds=>{S.rels={};ds.forEach(d=>S.rels[d.id]=d.data())});
 col_("reqs",ds=>{S.reqs=ds.map(d=>({id:d.id,...d.data()}))});
 col_("confs",ds=>{S.confs={};ds.forEach(d=>S.confs[d.id]=d.data())});
 S.left=TURN;
 S.tick=setInterval(()=>{S.left--;if(S.left<=0){S.left=TURN;if(S.room?.status==="playing")turn()}
  checkAttacks();if(S.atks.length&&!document.activeElement?.id&&!S.modal)draw();else{const e=document.getElementById("tm");if(e)e.textContent=S.left+"s"}},1000);
}
function leave(){unsub();S.code=null;S.room=null;S.view=S.profile?"menu":"login";vault.set("g4-room",null);draw()}
async function createRoom(){
 const name=document.getElementById("rn").value.trim().slice(0,40)||"Partita",pub=document.getElementById("rp").value==="1",c=Math.random().toString(36).slice(2,7).toUpperCase();
 try{await db.collection("rooms").doc(c).set({name,public:pub,host:uid,status:"lobby",created:Date.now()});S.code=c;await pd(uid).set({ready:false,user:S.profile.username});enter(c)}catch(e){S.msg="Errore: "+(e.message||e.code);draw()}
}
async function joinRoom(c){
 c=(c||"").trim().toUpperCase();if(!c)return;
 try{const s=await db.collection("rooms").doc(c).get();if(!s.exists){S.msg="Stanza non trovata";draw();return}
  S.code=c;const ps=await rc().collection("players").get();
  if(!ps.docs.some(d=>d.id===uid)){if(ps.size>=16){S.msg="Stanza piena";draw();return}await pd(uid).set({ready:false,user:S.profile.username})}
  enter(c)}catch(e){S.msg="Errore: "+(e.message||e.code);draw()}
}
const ready=()=>pd(uid).update({ready:!P().ready}),start=()=>rc().update({status:"playing"});
