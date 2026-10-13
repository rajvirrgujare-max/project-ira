(function(root){
'use strict';
const DB='ira-v06', VERSION=1;
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('tasks'))d.createObjectStore('tasks',{keyPath:'id'});if(!d.objectStoreNames.contains('memories'))d.createObjectStore('memories',{keyPath:'id'});if(!d.objectStoreNames.contains('messages'))d.createObjectStore('messages',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function all(store){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
async function put(store,obj){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(obj);tx.oncomplete=()=>{db.close();resolve(obj)};tx.onerror=()=>reject(tx.error);});}
async function del(store,id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error);});}
const id=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clean=s=>String(s||'').trim().slice(0,1000);
const now=()=>new Date().toISOString();
async function addTask(title,project='General',priority='normal',due=''){title=clean(title);if(!title)throw Error('Task title required');return put('tasks',{id:id(),title,project:clean(project)||'General',priority,done:false,due,createdAt:now()});}
async function addMemory(note,project='General'){note=clean(note);if(!note)throw Error('Memory required');return put('memories',{id:id(),note,project:clean(project)||'General',createdAt:now()});}
async function completeTask(taskId){const tasks=await all('tasks');const t=tasks.find(t=>t.id===taskId);if(!t)throw Error('Task not found');t.done=true;t.completedAt=now();return put('tasks',t);}
function plan(tasks,day=new Date()){const today=new Date(day.getFullYear(),day.getMonth(),day.getDate());const rank={high:0,normal:1,low:2};return tasks.filter(t=>!t.done).sort((a,b)=>{const overdue=t=>t.due&&new Date(t.due+'T00:00:00')<today?0:1;return overdue(a)-overdue(b)||(rank[a.priority]??1)-(rank[b.priority]??1)||(a.due||'9999').localeCompare(b.due||'9999')});}
function projectOf(text){const s=clean(text).toLowerCase();if(/last\s*coin|लास्ट\s*कॉइन|द लास्ट कॉइन/.test(s))return 'The Last Coin';if(/insomniac|इंसोम्नियाक|इंसोमनियाक/.test(s))return 'Insomniac';if(/project\s*ira|प्रोजेक्ट\s*इरा|ira\s*v0|इरा\s*v0/.test(s))return 'Project IRA';return 'General';}
function parseCommand(input){const raw=clean(input),s=raw.replace(/^(?:hey\s+)?(?:ira|इरा)[,\s:!।]*/i,'').trim();if(!s)return {type:'help'};
if(/(?:serious mode|सीरियस मोड|गंभीर होकर|professional mode)/i.test(s))return {type:'setTone',tone:'professional'};
if(/(?:normal mode|casual mode|नॉर्मल मोड|मज़ाक कर सकते|relax mode)/i.test(s))return {type:'setTone',tone:'casual'};
let m=s.match(/^(?:add task|create task|task add|टास्क जोड़ो|काम जोड़ो|टास्क बनाओ|एक काम जोड़ो|नया काम जोड़ो|मुझे याद दिलाना|remind me to)\s*[:,-]?\s*(.+)$/i);if(m)return {type:'addTask',title:m[1]};
m=s.match(/^(.+?)\s+(?:को\s+)?(?:टास्क में जोड़ो|काम में जोड़ो|task में add करो|task add करो)$/i);if(m)return {type:'addTask',title:m[1]};
m=s.match(/^(?:remember|याद रखो|याद रखना|note|नोट करो|ध्यान रखना)\s*[:,-]?\s*(.+)$/i);if(m)return {type:'addMemory',note:m[1]};
m=s.match(/^(?:complete task|finish task|टास्क पूरा करो|काम पूरा करो|task done)\s*#?\s*(\d+)$/i);if(m)return {type:'completeIndex',index:Number(m[1])};
if(/(आज.{0,15}प्लान|आज.{0,15}काम|कल.{0,15}काम|today.?s plan|daily plan|मेरा प्लान|plan क्या|plan दिखा|प्लान दिखा|क्या करना है|pending plan)/i.test(s))return {type:'plan',project:projectOf(s)};
if(/(pending|tasks|टास्क दिखाओ|काम दिखाओ|बाकी काम|काम की लिस्ट|task list|list tasks|कौन से काम)/i.test(s))return {type:'listTasks',project:projectOf(s)};
if(/(memory|memories|क्या याद|यादें|क्या याद है|याद दिलाओ)/i.test(s))return {type:'listMemories',project:projectOf(s)};
return {type:'unknown'};}
let toneOverride=null;const responseCounts={};
function detectTone(text){if(toneOverride)return toneOverride;const s=clean(text).toLowerCase();if(/(?:मौत|निधन|गुज़र गए|गुजर गए|दुखद|बुरी खबर|sad news|passed away|died|death|hospital|बहुत दुखी|रो रहा)/i.test(s))return 'emotional';if(/(?:urgent|अर्जेंट|तुरंत|फौरन|अभी चाहिए|एक घंटे में|emergency|critical)/i.test(s))return 'urgent';if(/(?:deadline|डेडलाइन|late|delay|missed|लेट हो|प्रोड्यूसर|producer|meeting|मीटिंग)/i.test(s))return 'professional';return 'casual';}
function vary(key,options){const i=responseCounts[key]||0;responseCounts[key]=i+1;return options[i%options.length];}
function formatPlan(tasks,project){if(!tasks.length)return vary('empty:'+project,['अभी कोई pending काम नहीं है'+(project!=='General'?' ('+project+')':'')+'।','फिलहाल '+(project==='General'?'तुम्हारी task list खाली है।':project+' में कोई pending task नहीं दिख रहा।'),'अभी तक कोई अधूरा काम दर्ज नहीं है।']);const lines=tasks.slice(0,15).map((t,i)=>`${i+1}. ${t.title} (${t.project}, ${t.priority}${t.due?', '+t.due:''})`).join('\n');const intro=vary('plan:'+project,['आज के pending काम ये हैं:','चलो, काम की स्थिति देखते हैं:','ये रही अभी की task list:','फिलहाल इन कामों पर ध्यान देना है:','ठीक है, हमारी planning में ये काम बाकी हैं:']);return intro+'\n'+lines;}
function toNum(v){if(v==null)return null;const x=String(v).replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x966));return /^\d+$/.test(x)?Number(x):null;}
function contextFromMessages(messages){
  const recent=messages.slice(-40);
  let project='General',stage=null,completed=[],pending=[],total=null,deadline=null,dailyTarget=null;
  for(const m of recent){
    const t=clean(m.text),p=projectOf(t);
    if(m.who==='user'&&p!=='General'&&p!==project){project=p;stage=null;completed=[];pending=[];total=null;deadline=null;dailyTarget=null;}
    if(m.who==='user'&&/(?:deadline|डेडलाइन).*(?:निकल|miss|late|delay)/i.test(t))stage='deadline';
    if(m.who==='ira'&&/कौन-सी deadline या deliverable प्रभावित|कौन-सी डेडलाइन/i.test(t))stage='deadline';

    if(m.who==='user'&&stage&&/(?:storyboard|स्टोरीबोर्ड|scenes?|सीन|shots?|शॉट)/i.test(t)&&/(?:pending|बाकी|नहीं हुए|अधूरे)/i.test(t)){
      stage='scenes';
      const n=t.match(/(\d+|[०-९]+)\s*(?:storyboard\s*)?(?:scenes?|सीन|shots?|शॉट)/i);
      if(n)total=toNum(n[1]);
      const rem=t.match(/(?:बाकी|remaining|pending)\s*(\d+|[०-९]+)\s*(?:scenes?|सीन|shots?|शॉट)|(\d+|[०-९]+)\s*(?:scenes?|सीन|shots?|शॉट)\s*(?:pending|बाकी)/i);
      if(rem){const count=toNum(rem[1]||rem[2]);if(count!=null)pending=Array.from({length:count},(_,i)=>i+1);}
    }

    if(m.who==='user'&&(stage==='scenes'||stage==='schedule')){
      const x=t.match(/(?:scene|scenes|सीन)\s*(\d+)\s*(?:और|and|,|&)\s*(\d+)\s*(?:तैयार|complete|done|पूरे)/i);
      if(x){completed=[Number(x[1]),Number(x[2])];stage='schedule';}
      const y=t.match(/(?:बाकी|remaining)\s*(\d+|[०-९]+)\s*(?:scenes?|सीन)|(\d+|[०-९]+)\s*(?:scenes?|सीन)\s*(?:pending|बाकी)/i);
      if(y&&completed.length){const count=toNum(y[1]||y[2]);pending=Array.from({length:count},(_,i)=>Math.max(...completed)+i+1);}
    }

    if(m.who==='user'&&stage==='schedule'&&/(?:कल|परसों|tomorrow|\d{1,2}[/-]\d{1,2}|दिन|days?|हफ्ते|week|शुक्रवार|friday|सोमवार|monday|मंगलवार|tuesday|बुधवार|wednesday|गुरुवार|thursday|शनिवार|saturday|रविवार|sunday)/i.test(t)){stage='date';deadline=t;}

    // V0.9.3: the assistant's own question is also state.
    if(m.who==='ira'&&/(?:रोज़|रोज|daily|per day).*(?:कितने|how many).*(?:scene|सीन|shot|शॉट)/i.test(t))stage='dailyTarget';
    if(m.who==='ira'&&/(?:क्या मैं इसे tasks में save|tasks में save.*या.*draft|सिर्फ draft)/i.test(t))stage='saveChoice';

    if(m.who==='user'&&stage==='dailyTarget'){
      const d=t.match(/(?:रोज़|रोज|daily|per day)?\s*(\d+|[०-९]+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:scenes?|सीन|shots?|शॉट)/i);
      if(d){const words={एक:1,दो:2,तीन:3,चार:4,पांच:5,'पाँच':5,छह:6,सात:7,आठ:8,नौ:9,दस:10};dailyTarget=words[d[1]]??toNum(d[1]);stage='saveChoice';}
    }
  }
  return stage?{kind:stage,project,completed,pending,total,deadline,dailyTarget}:null;
}
function followupReply(input,context){
  if(!context)return null;
  const s=clean(input);
  if(projectOf(s)!=='General'&&projectOf(s)!==context.project)return null;
  if(/(?:आज.{0,15}प्लान|task list|टास्क दिखाओ|याद रखो|add task|टास्क जोड़ो)/i.test(s))return null;

  if(context.kind==='deadline'&&/(?:storyboard|स्टोरीबोर्ड|scene|सीन|shot|शॉट)/i.test(s)&&/(?:pending|बाकी|नहीं हुए|अधूरे)/i.test(s)){
    const m=s.match(/(\d+|[०-९]+)\s*(?:storyboard\s*)?(?:scenes?|सीन|shots?|शॉट)/i);
    const n=m?m[1]+' ':'';
    return `समझ गई। ${context.project==='General'?'इस project':context.project} के ${n}storyboard scenes अभी पूरे नहीं हुए हैं। कौन-से तैयार हैं और कौन-से बाकी? फिर revised schedule बनाएँगे। बिना अनुमति कोई task नहीं बदलूँगी।`;
  }
  if(context.kind==='scenes'){
    const m=s.match(/(?:scene|scenes|सीन)\s*(\d+)\s*(?:और|and|,|&)\s*(\d+)\s*(?:तैयार|complete|done|पूरे)/i);
    const n=s.match(/(?:बाकी|remaining)\s*(\d+)\s*(?:scenes?|सीन)/i);
    if(m){const a=Number(m[1]),b=Number(m[2]);const count=n?Number(n[1]):null;const range=count&&b>=a?`Scene ${b+1} से ${b+count}`:'बाकी scenes';return `समझ गई। ${context.project} में Scene ${a} और ${b} तैयार हैं, और ${range} pending हैं। नई deadline क्या रखें? फिर practical schedule बनाएँगे।`;}
  }
  if(context.kind==='schedule'){
    if(/(?:कल|परसों|tomorrow|\d{1,2}[/-]\d{1,2}|दिन|days?|हफ्ते|week|शुक्रवार|friday|सोमवार|monday|मंगलवार|tuesday|बुधवार|wednesday|गुरुवार|thursday|शनिवार|saturday|रविवार|sunday)/i.test(s))return `ठीक है। ${context.project} के pending storyboard scenes के लिए यह deadline मानकर योजना बनाएँगे। रोज़ कितने scenes पूरे करना realistic रहेगा? अभी tasks में कोई बदलाव नहीं किया है।`;
    if(/(?:scene|सीन|shot|शॉट|\d)/i.test(s))return `समझ गई। ${context.project} की storyboard planning जारी है। नई deadline बताओ ताकि scenes को दिनों में बाँट सकें।`;
  }
  if(context.kind==='date'&&/(?:scene|सीन|रोज|daily|per day|दिन|day|\d)/i.test(s))return `ठीक है। ${context.project} के लिए रोज़ कितने scenes पूरे करना realistic रहेगा? अभी tasks में कोई बदलाव नहीं किया है।`;

  if(context.kind==='dailyTarget'){
    const d=s.match(/(?:रोज़|रोज|daily|per day)?\s*(\d+|[०-९]+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:scenes?|सीन|shots?|शॉट)/i);
    if(d){const words={एक:1,दो:2,तीन:3,चार:4,पांच:5,'पाँच':5,छह:6,सात:7,आठ:8,नौ:9,दस:10};const n=words[d[1]]??toNum(d[1]);return `ठीक है। ${context.project} के लिए रोज़ ${n} scenes का target रखेंगे। क्या मैं इसे tasks में save करूँ, या अभी सिर्फ draft schedule दिखाऊँ?`;}
  }
  if(context.kind==='saveChoice'){
    if(/(?:draft|ड्राफ्ट|सिर्फ दिखा|अभी save नहीं|save मत)/i.test(s))return `ठीक है। ${context.project} का schedule अभी draft ही रहेगा; tasks में कोई बदलाव नहीं कर रही।`;
    if(/(?:save|सेव|task|टास्क)/i.test(s))return `ठीक है। Save करने से पहले मैं exact task changes दिखाऊँगी और तुम्हारी स्पष्ट अनुमति के बाद ही उन्हें बदलूँगी।`;
  }
  return null;
}
async function respondWithContext(text,messages=[]){
  const c=parseCommand(text),context=contextFromMessages(messages);
  if(c.type==='unknown'||(c.type==='listTasks'&&context&&/(?:scene|सीन|storyboard|स्टोरीबोर्ड)/i.test(text))){
    const reply=followupReply(text,context);if(reply)return reply;
  }
  return respond(text);
}
async function respond(text){const c=parseCommand(text);const tone=detectTone(text);if(c.type==='setTone'){toneOverride=c.tone;return c.tone==='professional'?'समझ गई। अब सीधे, professional तरीके से बात करेंगे।':'ठीक है! अब normal, friendly अंदाज़ में बात करते हैं।';}if(c.type==='unknown'&&tone==='emotional')return vary('emotional',['ये सुनकर दुख हुआ। अगर बात करना चाहो तो मैं सुन रही हूँ।','समझ रही हूँ, यह आसान नहीं है। तुम चाहो तो बताओ क्या हुआ।','मैं यहाँ हूँ। अभी किसी काम की जल्दी नहीं है।']);if(c.type==='unknown'&&tone==='urgent')return 'समय कम है। सबसे ज़रूरी काम क्या है और कितनी देर बची है? उसी से शुरू करते हैं।';if(c.type==='unknown'&&tone==='professional')return 'समझ गई। कौन-सी deadline या deliverable प्रभावित हुई है? उसके हिसाब से revised plan बनाते हैं।';switch(c.type){case 'addTask':{const t=await addTask(c.title,projectOf(c.title));return 'Task added: '+t.title+' ('+t.project+')';}case 'addMemory':{const m=await addMemory(c.note,projectOf(c.note));return 'याद रख लिया: '+m.note+' ('+m.project+')';}case 'completeIndex':{const tasks=plan(await all('tasks'));const t=tasks[c.index-1];if(!t)return 'Task number नहीं मिला। Pending tasks देखो।';await completeTask(t.id);return 'Completed: '+t.title;}case 'plan':case 'listTasks':{let tasks=plan(await all('tasks'));if(c.project!=='General')tasks=tasks.filter(t=>t.project===c.project||projectOf(t.title)===c.project);return formatPlan(tasks,c.project);}case 'listMemories':{let m=await all('memories');if(c.project!=='General')m=m.filter(x=>x.project===c.project||projectOf(x.note)===c.project);return m.length?m.slice(-12).map(x=>`• ${x.note} (${x.project})`).join('\n'):'अभी कोई memory save नहीं है।';}case 'help':return 'बोलो: इरा आज का प्लान दिखाओ; IRA add task The Last Coin storyboard; इरा याद रखो Insomniac blue tone।';default:return 'मैं अभी offline tasks और memories संभालती हूँ। Try: इरा आज का प्लान दिखाओ। (यह rule-based assistant है, generative AI नहीं।)';}}

root.IRA={contextFromMessages,followupReply,respondWithContext,detectTone,vary,formatPlan,openDB,all,put,del,addTask,addMemory,completeTask,plan,projectOf,parseCommand,respond};
})(typeof window!=='undefined'?window:globalThis);
