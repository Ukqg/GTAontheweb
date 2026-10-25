const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const page = fs.readFileSync('public/play/index.html', 'utf8');
const events = {}, docEvents = {}, canvasEvents = {};
const on = registry => (name, fn) => (registry[name] ??= []).push(fn);
const canvas = {addEventListener:on(canvasEvents), getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
const document = {hidden:false,hasFocus:()=>true,addEventListener:on(docEvents),pointerLockElement:canvas};
const buffer = new SharedArrayBuffer(1024);
const context = vm.createContext({Atomics,Uint8Array,Int32Array,Uint16Array,Set,Object,Math,Promise,
  q:new URLSearchParams('fixed=1'),window:{PlayGTA5Enhanced:true},document,canvas,
  startSize:[1280,720],startMode:0,postLog(){},addEventListener:on(events)});
const vk = page.slice(page.indexOf('const VK ='), page.indexOf('// ?dbg=1'));
const input = page.slice(page.indexOf('function installInput('),page.lastIndexOf('</script>'));
vm.runInContext(vk + input + '\ninstallInput(memory,0);', vm.createContext(Object.assign(context,{memory:{buffer}})));
const keys = new Uint8Array(buffer,0,256), w = new Int32Array(buffer,256,10);
function fire(type,code,extra={}) { for(const fn of events[type]??[]) fn({code,key:'',preventDefault(){},...extra}); }
fire('keydown','ShiftLeft');fire('keydown','ShiftRight');assert.equal(keys[16],128);
fire('keyup','ShiftLeft');assert.equal(keys[16],128);assert.equal(keys[160],0);
fire('keyup','ShiftRight');assert.equal(keys[16],0);
fire('keydown','ControlLeft');assert.equal(keys[17],128);
fire('keydown','KeyI');assert.equal(keys[104],128);
fire('keydown','Numpad8');fire('keyup','KeyI');assert.equal(keys[104],128);
fire('keyup','Numpad8');assert.equal(keys[104],0);
fire('keydown','KeyW',{target:{closest:()=>true}});assert.equal(keys[87],0);
fire('keydown','KeyW');w[2]=30;w[5]=1;
document.hidden=true;for(const fn of docEvents.visibilitychange)fn();
assert.equal(keys[87],0);assert.equal(keys[17],0);assert.equal(w[2],0);assert.equal(w[5],0);assert.equal(w[6],0);
document.hidden=false;for(const fn of docEvents.visibilitychange)fn();assert.equal(w[6],1);
fire('keydown','KeyW');document.pointerLockElement=null;for(const fn of docEvents.pointerlockchange)fn();assert.equal(keys[87],0);
console.log('PASS: keyboard modifiers, simultaneous aircraft aliases, editable controls, visibility and pointer-lock release');
