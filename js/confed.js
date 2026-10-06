// Confederazione: cassa comune e uscita (la creazione/adesione passa dalle richieste in diplo.js)
const cf=id=>rc().collection("confs").doc(id);
async function leaveConf(){const c=myConf();if(!c||!confirm("Uscire dalla confederazione?"))return;const m=c.members.filter(x=>x!==uid);
 await pd(uid).update({conf:""});
 if(m.length>1)await cf(c.id).update({members:m});
 else{await cf(c.id).delete();for(const x of m)await pd(x).update({conf:""})} // ne resterebbe uno solo: si scioglie
 S.modal=null;draw()}
