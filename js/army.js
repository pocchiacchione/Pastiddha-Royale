// Esercito e conquista a tempo
const pw=(tr,f)=>Object.entries(tr||{}).reduce((s,[k,v])=>s+v*UN[k][f],0);
const sc=(tr,f)=>Object.fromEntries(Object.entries(tr||{}).map(([k,v])=>[k,Math.floor(v*f)]));
const cnt=tr=>Object.values(tr||{}).reduce((a,b)=>a+b,0);
async function sendAtk(from,to){const t=S.tiles[from],tr=t.troops||{},ks=Object.keys(tr).filter(k=>tr[k]>0);if(!ks.length)return;
 const slow=UN[ks.reduce((a,k)=>UN[k].t>UN[a].t?k:a,ks[0])],dur=Math.max(slow.min,slow.t-(cnt(tr)-1)); // unità più lenta, -1s per truppa extra
 await rc().collection("attacks").doc(uid+"_"+Date.now()).set({by:uid,from,to,troops:tr,end:Date.now()+dur*1000});
 await tdoc(from).set({...t,troops:{}})}
const busy=new Set();
function checkAttacks(){S.atks.filter(a=>a.by===uid&&a.end<=Date.now()&&!busy.has(a.id)).forEach(a=>{busy.add(a.id);resolve(a)})}
async function resolve(a){const T=S.tiles[a.to],A=pw(a.troops,"a"),D=pw(T.troops,"d");
 if(T.owner&&!atWar(a.by,T.owner)){ // non più in guerra (pace, alleanza, confederazione, quadrato proprio): le truppe tornano indietro
  const F=S.tiles[a.from];if(F&&F.owner===a.by){const tr={...(F.troops||{})};Object.entries(a.troops||{}).forEach(([k,v])=>tr[k]=(tr[k]||0)+v);await tdoc(a.from).set({...F,troops:tr})}}
 else if(A>D)await tdoc(a.to).set({owner:a.by,troops:sc(a.troops,(A-D)/A),...(T.factory&&!a.troops.p?{factory:true}:{})}); // artiglieria distrugge fabbriche
 else await tdoc(a.to).set({...T,troops:sc(T.troops,(D-A)/D)});
 await rc().collection("attacks").doc(a.id).delete();busy.delete(a.id)}
