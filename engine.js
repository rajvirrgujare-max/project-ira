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
function parseCommand(input){const raw=clean(input),s=raw.replace(/^(ira|इरा)[,\s:!]*/i,'').trim();if(!s)return {type:'help'};
let m=s.match(/^(?:add task|create task|task add|टास्क जोड़ो|काम जोड़ो|टास्क बनाओ)\s*[:,-]?\s*(.+)$/i);if(m)return {type:'addTask',title:m[1]};
m=s.match(/^(?:remember|याद रखो|याद रखना|note)\s*[:,-]?\s*(.+)$/i);if(m)return {type:'addMemory',note:m[1]};
m=s.match(/^(?:complete task|finish task|टास्क पूरा करो|काम पूरा करो)\s*#?\s*(\d+)$/i);if(m)return {type:'completeIndex',index:Number(m[1])};
if(/(आज का प्लान|today.?s plan|daily plan|मेरा प्लान)/i.test(s))return {type:'plan'};
if(/(pending|tasks|टास्क दिखाओ|काम दिखाओ|बाकी काम)/i.test(s))return {type:'listTasks'};
if(/(memory|memories|क्या याद|यादें)/i.test(s))return {type:'listMemories'};
return {type:'unknown'};}
async function respond(text){const c=parseCommand(text);switch(c.type){case 'addTask':await addTask(c.title);return 'Task added: '+c.title;case 'addMemory':await addMemory(c.note);return 'याद रख लिया: '+c.note;case 'completeIndex':{const tasks=plan(await all('tasks'));const t=tasks[c.index-1];if(!t)return 'Task number नहीं मिला। Pending tasks देखो।';await completeTask(t.id);return 'Completed: '+t.title;}case 'plan':case 'listTasks':{const tasks=plan(await all('tasks'));return tasks.length?tasks.slice(0,15).map((t,i)=>`${i+1}. ${t.title} (${t.project}, ${t.priority}${t.due?', '+t.due:''})`).join('\n'):'अभी कोई pending task नहीं है।';}case 'listMemories':{const m=await all('memories');return m.length?m.slice(-12).map(x=>`• ${x.note} (${x.project})`).join('\n'):'अभी कोई memory save नहीं है।';}case 'help':return 'बोलो: IRA add task edit scene 2; IRA याद रखो blue tone; IRA आज का प्लान।';default:return 'मैं अभी tasks और memories संभाल सकती हूँ। Try: IRA आज का प्लान। (यह offline rule-based assistant है, generative AI नहीं।)';}}
root.IRA={openDB,all,put,del,addTask,addMemory,completeTask,plan,parseCommand,respond};
})(typeof window!=='undefined'?window:globalThis);
