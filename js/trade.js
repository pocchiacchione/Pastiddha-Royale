// Scambio: proposta al giocatore, che accetta o rifiuta (mai durante una guerra)
const K=["gold","fe","le","ca"];
const fmtT=(o,t)=>{const s=K.filter(k=>o[k]).map(k=>o[k]+" "+RN[k]);if(t?.length)s.push("quadrati "+t.map(i=>i+1).join(", "));return s.join(", ")||"nulla"};
const has=(p,x)=>K.every(k=>(k==="gold"?p.gold:(p.res||{})[k]||0)>=(x[k]||0));
function openTrade(to){S.msg="";S.modal={type:"trade",to,d:{g:{},a:{},gt:[],at:[]}};draw()}
const tgl=(key,i,on)=>{const a=S.modal.d[key],j=a.indexOf(i);if(on&&j<0)a.push(i);if(!on&&j>=0)a.splice(j,1)};
async function sendTrade(){const m=S.modal,d=m.d,to=m.to,p=P(),n=o=>Object.fromEntries(K.map(k=>[k,Math.max(0,Math.floor(+o[k]||0))])),give=n(d.g),ask=n(d.a);
 if(atWar(uid,to)){S.msg="Non si può scambiare durante una guerra";return draw()}
 if(!K.some(k=>give[k]||ask[k])&&!d.gt.length&&!d.at.length){S.msg="Scegli cosa scambiare";return draw()}
 if(!has(p,give)||d.gt.some(i=>S.tiles[i].owner!==uid)){S.msg="Non hai abbastanza da dare";return draw()}
 await sendReq(to,"trade",{give,ask,giveT:[...d.gt],askT:[...d.at]});S.modal=null;S.msg="Proposta inviata";draw()}
async function execTrade(r){const a=P(),b=S.players[r.from],gt=r.giveT||[],at=r.askT||[];
 if(!b)return"Il giocatore non c'è più";
 if(atWar(r.from,uid))return"Non si può scambiare durante una guerra";
 if(!has(b,r.give)||!has(a,r.ask))return"Risorse insufficienti (da una delle due parti)";
 if(gt.some(i=>S.tiles[i].owner!==r.from)||at.some(i=>S.tiles[i].owner!==uid))return"I quadrati non sono più di chi li offre";
 const mv=(p,out,inn)=>({gold:p.gold-out.gold+inn.gold,res:Object.fromEntries(["fe","le","ca"].map(k=>[k,((p.res||{})[k]||0)-out[k]+inn[k]]))});
 await pd(r.from).update(mv(b,r.give,r.ask));await pd(uid).update(mv(a,r.ask,r.give));
 for(const i of gt)await tdoc(i).set({...S.tiles[i],owner:uid,troops:{}});
 for(const i of at)await tdoc(i).set({...S.tiles[i],owner:r.from,troops:{}});
 return""}
