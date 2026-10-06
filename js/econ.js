// Economia: oro, risorse, popolazione, fabbriche, reclutamento
const gIncome=id=>{const p=S.players[id];return p&&p.nation?tilesOf(id).reduce((s,i)=>s+GOV[p.gov][1]*(S.tiles[i].factory?1.2:1),0):0};
const share=()=>{const c=myConf();return c?c.members.reduce((s,m)=>s+gIncome(m),0)/c.members.length:gIncome(uid)}; // cassa comune divisa equamente
async function turn(){const p=P();if(!p||!p.nation)return;const mt=tilesOf(uid),r={...p.res};mt.forEach(i=>{const k=RESMAP[i];if(k)r[k]=(r[k]||0)+1});
 await pd(uid).update({gold:p.gold+Math.round(share()),res:r,pop:p.pop+mt.length*5*GOV[p.gov][2]})}
async function createNation(){
 const name=document.getElementById("nn").value.trim().slice(0,MAXN),gov=+document.getElementById("ng").value;if(!name){alert("Inserisci il nome");return}
 const i=S.modal.tile;await pd(uid).update({nation:name,gov,gold:START-BASE,res:{fe:4,le:4,ca:2},pop:100,capital:i,conf:""});
 await tdoc(i).set({owner:uid,troops:{}});S.modal=null;S.sel=null;draw()}
async function saveNation(){
 const name=document.getElementById("nn").value.trim().slice(0,MAXN),gov=+document.getElementById("ng").value;if(!name){alert("Il nome non può essere vuoto");return}
 await pd(uid).update({nation:name,gov});S.modal=null;draw()}
async function buy(i){const p=P();if(S.tiles[i].owner){S.msg="I quadrati altrui si ottengono solo con il commercio";return draw()}
 if(p.gold<BASE){S.msg="Oro insufficiente";return draw()}
 await pd(uid).update({gold:p.gold-BASE});await tdoc(i).set({owner:uid,troops:{}});S.sel=null;S.msg="";draw()}
async function factory(i){const p=P(),r={...p.res};if(p.gold<FACT||(r.fe||0)<2){S.msg="Servono 100 oro + 2 ferro";return draw()}r.fe-=2;
 await pd(uid).update({gold:p.gold-FACT,res:r});await tdoc(i).set({...S.tiles[i],factory:true});S.msg=""}
const setCap=i=>pd(uid).update({capital:i});
async function recruit(i,k){const p=P(),u=UN[k],t=S.tiles[i],r={...p.res};
 if(p.gold<u.g||p.pop<u.pop||Object.entries(u.r).some(([a,b])=>(r[a]||0)<b)){S.msg="Risorse/popolazione insufficienti";return draw()}
 Object.entries(u.r).forEach(([a,b])=>r[a]-=b);
 await pd(uid).update({gold:p.gold-u.g,pop:p.pop-u.pop,res:r});const tr=t.troops||{};await tdoc(i).set({...t,troops:{...tr,[k]:(tr[k]||0)+1}});S.msg=""}
