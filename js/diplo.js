// Diplomazia: guerra/pace, alleanza, confederazione, scambio. Le richieste vanno al destinatario, che accetta o rifiuta; l'esito torna al mittente.
const pk=(a,b)=>[a,b].sort().join("~");
const relOf=(a,b)=>S.rels[pk(a,b)]?.type||"",atWar=(a,b)=>relOf(a,b)==="war",isAlly=(a,b)=>relOf(a,b)==="ally";
const rl=(a,b)=>rc().collection("rels").doc(pk(a,b)),rq=id=>rc().collection("reqs").doc(id);
const others=()=>Object.keys(S.players).filter(x=>x!==uid&&S.players[x].nation);
const pending=(from,to,type)=>S.reqs.find(r=>r.from===from&&r.to===to&&r.type===type&&r.status==="pending");
const cfOf=id=>{const c=S.players[id]?.conf;return c&&S.confs[c]?c:""};
const inbox=()=>S.reqs.filter(r=>(r.to===uid&&(r.status==="pending"||r.status==="info"))||(r.from===uid&&(r.status==="accepted"||r.status==="declined")));
const WHAT={peace:"la tua richiesta di pace",ally:"la tua proposta di alleanza",conf:"la tua proposta di confederazione",trade:"il tuo scambio"};

async function sendReq(to,type,extra={}){if(type!=="trade"&&pending(uid,to,type))return;
 await rq(uid+"_"+Date.now()).set({from:uid,to,type,status:"pending",...extra});if(type!=="trade"){S.msg="Richiesta inviata";draw()}}
const cancelReq=id=>rq(id).delete();

async function declareWar(to){const q=S.players[to];if(!q||atWar(uid,to))return;
 if(sameConf(uid,to)){S.msg="Siete confederati: esci prima dalla confederazione";return draw()}
 if(!confirm("Dichiarare guerra a "+nm(to)+"?"))return;
 const was=isAlly(uid,to);
 await rl(uid,to).set({a:uid,b:to,type:"war",by:uid,since:Date.now()});
 for(const r of S.reqs.filter(r=>r.status==="pending"&&r.type!=="peace"&&((r.from===uid&&r.to===to)||(r.from===to&&r.to===uid))))await rq(r.id).delete();
 await rq(uid+"_"+Date.now()).set({from:uid,to,type:"info",status:"info",text:was?"ha rotto l'alleanza e ti ha dichiarato guerra":"ti ha dichiarato guerra"});
 S.msg="Guerra dichiarata";draw()}

// esegue l'effetto di una richiesta accettata; ritorna un messaggio d'errore oppure ""
async function applyReq(r){const a=r.from,b=r.to;
 if(r.type==="peace"){await rl(a,b).delete();return""}
 if(atWar(a,b))return"Siete in guerra: serve prima la pace";
 if(r.type==="ally"){if(sameConf(a,b))return"Siete già confederati";await rl(a,b).set({a,b,type:"ally",since:Date.now()});return""}
 if(r.type==="conf"){const ca=cfOf(a),cb=cfOf(b);
  if(ca&&ca===cb)return"Siete già nella stessa confederazione";if(ca&&cb)return"Siete già in due confederazioni diverse";
  if(cb){await cf(cb).update({members:[...S.confs[cb].members,a]});await pd(a).update({conf:cb})}
  else if(ca){await cf(ca).update({members:[...S.confs[ca].members,b]});await pd(b).update({conf:ca})}
  else{const id=a+"_"+Date.now();await cf(id).set({name:(nm(a)+" & "+nm(b)).slice(0,40),members:[a,b],invited:[]});await pd(a).update({conf:id});await pd(b).update({conf:id})}
  return""}
 if(r.type==="trade")return execTrade(r);
 return"Richiesta sconosciuta"}
async function respond(id,ok){const r=S.reqs.find(x=>x.id===id);if(!r||r.status!=="pending"||r.to!==uid)return;
 if(ok){const e=await applyReq(r);if(e){S.msg=e;return draw()}}
 await rq(id).update({status:ok?"accepted":"declined"});S.msg=""}
const dismiss=id=>rq(id).delete();

const desc=r=>{const w=esc(nm(r.from));
 return r.type==="peace"?`🕊️ <b>${w}</b> chiede la pace`:r.type==="ally"?`🤝 <b>${w}</b> propone un'alleanza`:r.type==="conf"?`🏛️ <b>${w}</b> propone una confederazione`:
 `🔁 <b>${w}</b> propone uno scambio:<br>dà ${esc(fmtT(r.give,r.giveT))}<br>chiede ${esc(fmtT(r.ask,r.askT))}`};
function inboxH(){const L=inbox();
 return `<div class="modal"><div><h2>📨 Richieste</h2>${L.length?L.map(r=>{const id=r.id;
  if(r.status==="pending")return `<div class="card">${desc(r)}<div class="row"><button class="g" onclick="respond('${id}',false)">Rifiuta</button><button onclick="respond('${id}',true)">Accetta</button></div></div>`;
  if(r.status==="info")return `<div class="card">⚔️ <b>${esc(nm(r.from))}</b> ${esc(r.text)}<div class="row"><button class="g" onclick="dismiss('${id}')">OK</button></div></div>`;
  return `<div class="card">${r.status==="accepted"?"✅":"❌"} <b>${esc(nm(r.to))}</b> ha ${r.status==="accepted"?"accettato":"rifiutato"} ${WHAT[r.type]}<div class="row"><button class="g" onclick="dismiss('${id}')">OK</button></div></div>`}).join(""):'<p class="m">Nessuna richiesta.</p>'}
  <p class="m">${esc(S.msg)}</p><button class="g" style="width:100%" onclick="S.modal=null;S.msg='';draw()">Chiudi</button></div></div>`}

function playerH(id){const q=S.players[id];
 if(!q||!q.nation)return `<div class="modal"><div><p class="m">Nazione non trovata.</p><button class="g" style="width:100%" onclick="S.modal=null;draw()">Chiudi</button></div></div>`;
 const war=atWar(uid,id),ally=isAlly(uid,id),conf=sameConf(uid,id),mc=cfOf(uid),tc=cfOf(id),n=tilesOf(id).length;
 const st=war?"⚔️ In guerra":conf?"🏛️ Confederati":ally?"🤝 Alleati":"Neutrale";
 const ask=(t,label,dis)=>{const p=pending(uid,id,t);return p?`<button class="g" onclick="cancelReq('${p.id}')">⏳ ${label}: in attesa (annulla)</button>`:`<button ${dis?"disabled":""} onclick="sendReq('${id}','${t}')">${label}</button>`};
 let b="";
 b+=war?ask("peace","🕊️ Richiedi la pace"):`<button class="g" ${conf?"disabled":""} onclick="declareWar('${id}')">⚔️ Dichiara guerra</button>`;
 if(!conf){b+=ally?`<button class="g" disabled>🤝 Siete alleati</button>`:ask("ally","🤝 Proponi alleanza",war)}
 if(conf)b+=`<button class="g" onclick="leaveConf()">🏛️ Esci dalla confederazione</button>`;
 else b+=ask("conf",mc&&!tc?"🏛️ Invita nella tua confederazione":tc&&!mc?"🏛️ Chiedi di unirti alla confederazione":"🏛️ Crea confederazione",war||(mc&&tc));
 b+=`<button ${war?"disabled":""} onclick="openTrade('${id}')">🔁 Scambia</button>`;
 const hint=war?"Durante la guerra non si può fare alleanza, confederazione né scambi. Per attaccare: seleziona un tuo quadrato con truppe → ⚔️ Attacca → tocca un quadrato nemico.":mc&&tc&&!conf?"Siete in due confederazioni diverse: non è possibile unirle.":"";
 return `<div class="modal"><div><h2><span style="color:${col(id)}">■</span> ${esc(q.nation)}</h2><div class="m">${esc(GOV[q.gov][0])} · ${n} quadrati · ${st}</div>
  <div class="col">${b}</div>${hint?`<p class="m">${hint}</p>`:""}<p class="m">${esc(S.msg)}</p><button class="g" style="width:100%" onclick="S.modal=null;S.msg='';draw()">Chiudi</button></div></div>`}

function tradeModalH(){const m=S.modal,d=m.d,to=m.to,p=P()||{},r=p.res||{},num=(g,k,l)=>`<input id="${g}${k}" type="number" min="0" placeholder="${l}" value="${d[g][k]??""}" oninput="S.modal.d.${g}.${k}=this.value">`,
 tl=(key,list)=>`<div class="tl">${list.length?list.map(i=>`<label><input type="checkbox" ${d[key].includes(i)?"checked":""} onchange="tgl('${key}',${i},this.checked)">${i+1}</label>`).join(""):'<span class="m">nessuno</span>'}</div>`,
 fld=g=>`<div class="row">${num(g,"gold","💰")}${num(g,"fe","🔩")}${num(g,"le","🌲")}${num(g,"ca","⚫")}</div>`;
 return `<div class="modal"><div><h2>🔁 Scambia con ${esc(nm(to))}</h2><div class="m">Hai: 💰${Math.floor(p.gold||0)} 🔩${r.fe||0} 🌲${r.le||0} ⚫${r.ca||0}</div>
  <h2>Tu dai</h2>${fld("g")}<div class="m">Quadrati che cedi</div>${tl("gt",tilesOf(uid))}
  <h2>In cambio chiedi <span class="m">(facoltativo)</span></h2>${fld("a")}<div class="m">Quadrati che chiedi</div>${tl("at",tilesOf(to))}
  <p class="m">${esc(S.msg)}</p><div class="row"><button class="g" onclick="S.msg='';S.modal={type:'player',id:'${to}'};draw()">Indietro</button><button onclick="sendTrade()">Invia proposta</button></div></div></div>`}
